# MCP servers in Python

The LLM is the caller. That changes the failure modes: an error has to be machine-readable, every input is attacker-influenced, and a green test suite routinely proves nothing about whether the tools work.

Verified against **`mcp` 2.1.1** and **`mcp` 1.29.1** on Python 3.12/3.14 (2026-09-02) by driving `list_tools()` and `call_tool()` in-process. Check the lockfile's major before applying anything below.

## The rename that breaks every published example

`pip install mcp` / `uv add mcp` resolves to **2.x**, where `FastMCP` was renamed **`MCPServer`**:

```python
from mcp.server.mcpserver import MCPServer     # 2.x
mcp = MCPServer("my-server")
```

The 1.x import fails loudly and tells you so:

```
ModuleNotFoundError: No module named 'mcp.server.fastmcp'. This is mcp 2.x, where
FastMCP was renamed to MCPServer (from mcp.server.mcpserver import MCPServer) and
other APIs changed; ... or pin 'mcp<2' to keep running v1 code.
```

Nearly every tutorial, blog post and community skill still teaches `from mcp.server.fastmcp import FastMCP`. Read the installed version before copying any example — `python -c "import importlib.metadata as m; print(m.version('mcp'))"`.

**Three different things are called FastMCP**, and they are not interchangeable:

| Package | Import | Notes |
|---|---|---|
| `mcp` 1.x (official SDK) | `from mcp.server.fastmcp import FastMCP` | the original; still installable via `mcp<2` |
| `mcp` 2.x (official SDK) | `from mcp.server.mcpserver import MCPServer` | current default install |
| `fastmcp` (standalone, jlowin) | `from fastmcp import FastMCP` | a separate project — 4.0.0 depends on `mcp` 2.1.1 and layers its own API on top |

Pick one and say which in the README; a repo with both `mcp` and `fastmcp` in its lockfile is two frameworks deep.

## A bare `-> dict` silently drops structured output

The return annotation *is* the output schema. Verified on 2.1.1:

| annotation | `output_schema` | `structured_content` |
|---|---|---|
| none | `None` | `None` |
| `-> dict` | `None` | `None` |
| `-> dict[str, int]` | a real object schema | `{'a': 1}` |
| `-> int` | `{'properties': {'result': …}}` | `{'result': 42}` |

An unparameterized `dict` — the annotation almost every example uses — returns text only. Parameterize it (`dict[str, Any]` at minimum) or return a Pydantic model, whenever the caller should get structured content.

And the schema is **enforced on the way out**: a tool annotated `-> int` that returns `{"error": "..."}` raises, so the return-an-error-dict convention only works if the annotation admits it. Decide the error shape and the annotation together.

## Which exceptions reach the model

Also verified on 2.1.1 — the difference is stark:

```python
raise ValueError("secret-ish detail")   # caller sees: UnexpectedToolError: Error executing tool <name>
raise ToolError("message for the model")  # caller sees: ToolError: Error executing tool <name>: message for the model
```

`from mcp.server.mcpserver.exceptions import ToolError`. An ordinary exception is swallowed into a generic string with the tool name and nothing else — the model cannot see what went wrong, cannot retry differently, and cannot report it to the user. So:

- **Expected failures**: return a value in your documented shape (with an annotation that admits it), or raise `ToolError` with a message written *for the model*.
- **Programming errors**: let them escape. The generic wrapper is the right behavior there, and it keeps a stack trace out of the transcript.
- **Pick one error shape and use it everywhere**, and document that callers must check for it. The common inconsistency: a single-item tool collects per-item errors while its "do this across a directory" sibling silently `continue`s past files that fail to load. For automation that is invisible data loss — every batch tool returns both results and a per-item `skipped`/`errors` list.

## Sync tools and the event loop — gated on the SDK major

| SDK | dispatch of a sync `@mcp.tool()` |
|---|---|
| `mcp` 1.x | `return fn(**arguments)` — **inline on the protocol event loop** |
| `mcp` 2.x | `await anyio.to_thread.run_sync(...)` — a worker thread |

Verified in both: on 2.1.1 a sync tool reporting `threading.current_thread().name` returns `AnyIO worker thread`; 1.29.1's `func_metadata` has no `to_thread` call at all. So on **1.x** a five-second SQLite query, filesystem walk or synchronous HTTP call in a sync tool blocks pings and every unrelated request for those five seconds — make the tool `async` and move only the blocking boundary with `await asyncio.to_thread(...)`. On **2.x** that wrapper is redundant for a plain sync tool; what still needs it is blocking work inside a tool you wrote as `async`.

Test responsiveness rather than the slow tool's own timing — a timing assertion on the slow call cannot detect starvation. Block a repository call, invoke a lightweight tool before releasing it, and require the light one to finish first:

```python
slow = asyncio.create_task(call_tool("find_dependents", {"item_id": 42}))
await entered_worker.wait()
healthy = await asyncio.wait_for(call_tool("health", {}), timeout=0.2)
assert healthy == {"ok": True}
release_worker.set()
await slow
```

## Wrapping a subprocess or CLI

Most MCP servers shell out. Three failures recur:

1. **Hand both streams and the return code to the model** — `SKILL.md`'s non-zero-exit trap, where the wrapper reports a successful run as `"Error: "`. The model is the one judging, so give it what to judge.
2. **Pin to the version you actually wrap and verify subcommands exist.** A server written against a tool's 2.x CLI while the project pins 3.x calls flags that no longer exist, and every tool breaks at runtime. Check the *installed* `--help`, not your memory of it.
3. **The LLM — or content it read — chose the target.** `SKILL.md` has the argv-and-`shlex` rule; what is MCP's alone is that the path arriving in a tool argument was selected by something downstream of an attacker, so it gets validated against a resolved base before it is used.

## No module-level global state

Parsing CLI args at import time and stashing them in module globals (`WORKING_DIR`, caches) forces every test to `del sys.modules["server"]` and re-import under a patched `sys.argv` just to reset. Build from a factory instead:

```python
def build_server(config: Config) -> MCPServer:
    mcp = MCPServer("my-server")

    @mcp.tool()
    def do_thing(x: str) -> dict[str, str]:
        return {"result": _work(x, config)}   # captured, not global

    return mcp
```

This also avoids **double registration**: a module-level registration loop *plus* the same loop inside `main()` registers every tool twice when the file is run directly (`uv run server.py`, which is how Claude Desktop launches it) rather than through a console entry point. Register in exactly one place.

## Sampling is an optional client capability

`ctx.sample(...)` is not guaranteed to work just because the tool was called. The client may not support sampling, or its handler may raise — different failures at the framework layer, the same outcome at the tool layer. Catch at the sampling boundary *inside* the tool and convert to your normal error shape; by the time the framework's outer wrapper sees it, the caller gets an opaque error instead of your documented contract. Keep the `try` narrow so unrelated bugs aren't mislabeled, and test both branches — a client with no sampling support, and a handler that raises.

## Distribution

- **`server.py` beside a `server/` package** hits `SKILL.md`'s shadowing trap, and MCP is where it hides longest: `uv run server.py` keeps working while the console entry point finds no `main`.
- **Over-narrow build includes** ship a wheel with one file in it, green (`reference/packaging.md`). Both traps land on the same smoke test — which is why `import server` proves nothing here.
- **PEP 723 single-file servers**: pin explicit versions in the inline `# /// script` header *and* keep them in sync with `pyproject.toml`. A dependency that is imported but only transitively declared breaks the moment the intermediary drops it.

## What a vacuous suite proves

Mocking the subprocess or transport layer and asserting that argv contains certain tokens locks in commands that may not exist — the suite stays green while every tool is broken at runtime, the most expensive vacuous pass in this stack. Keep at least one integration test that invokes the real wrapped tool end to end, assert a tool *runs and returns expected output* rather than that `import server` resolves, and test the error contract itself: malformed input returns your documented shape, batch tools populate `skipped`.

## Every input is untrusted

Tool inputs, file contents, and especially **other tools' descriptions** can be attacker-influenced and flow into the model's context. A server that feeds such text into a second LLM call is itself a prompt-injection surface, and its output is advisory rather than authoritative. Grant a tool no more filesystem or network reach than it needs, validate paths against a resolved base (`Path.resolve()` plus `is_relative_to` — the check a symlink defeats when you validate only the input string), and never treat tool output as a trusted instruction.
