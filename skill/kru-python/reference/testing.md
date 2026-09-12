# Python test mechanics

The craft — how to find this repo's conventions, what a test worth keeping asserts, the run→fix loop — is the **`testing`** skill's, and the red→green loop is **`tdd`**'s. This file is only what is Python-specific and costs a suite its meaning.

Reproduced on Python 3.14.3 (2026-09-02).

## Ambient state: tests that only pass on your machine

A test that reads state it never set — env vars, a module global, the working directory, the clock — is testing the machine as much as the code.

- **Pin every variable feeding a lookup, not just the one you know about.** Config-directory resolution is the classic: setting `HOME` looks sufficient, but on Linux the XDG variables are set independently, so the lookup ignores your `tmp_path` and every test shares one real config directory — run order then decides who fails. Set `HOME` *and* `XDG_CONFIG_HOME`. When a platform difference decides whether a variable is read, the incomplete test is untested on exactly the platform CI runs.
- **Import-time configuration breaks collection, not tests.** `settings = Settings()` at module scope is evaluated on import, so a missing variable fails *collection* — before any fixture runs, so no fixture can fix it. Declare those variables where collection sees them (pytest config or a root `conftest.py`), mirroring CI's `env:` block; better, build config in a factory so importing the module is inert.
- **Module-level globals outlive the test that populated them.** Reset a cache in an `autouse` fixture *before and after* — the trailing reset is what stops the last test in a file leaking into the next file.
- **`reset_mock()` keeps the stub.** Verified: after `m.return_value = 42; m(); m.reset_mock()`, the call count is cleared but `m()` still returns `42`. Only `m.reset_mock(return_value=True, side_effect=True)` actually resets it — so a stub set in one test keeps answering in the next.
- **The working directory is an input.** Code that shells out inherits the process CWD, so a test asserting "runs against the path I passed" is vacuous when the test's own CWD is already a valid project — it passes whether or not the path is threaded through at all. `monkeypatch.chdir(tmp_path)` first, so a CWD fallback would actually fail.
- **Freeze the clock and keep it frozen.** Restoring the real clock mid-test hands wall-clock time back to any date logic that runs afterward; a business-hours branch is then green during the day and red at night.
- **An unmocked network call is a passing test.** A missing `httpx_mock` fixture hits the live API — slow, flaky, rate-limited, deterministic about nothing. `pytest-socket`'s `--disable-socket` turns that into a loud failure.

## Assertions that cannot fail

- **A guarded assertion vacuously passes.** `if index_html.exists(): assert "theme.css" in ...` passes when the build broke. Assert the precondition, then the behavior.
- **Presence is blind to duplicates.** `assert '<link rel="canonical"' in html` proves at least one exists — not that there aren't two disagreeing ones, which is the exact shape of generated-output bugs where a base template and your override each emit one. Extract every occurrence with `re.findall` and compare the whole list; same for anything countable (`len(rows) == 2` plus the values, not `assert rows`).
- **Mocking the thing under test.** Patching `_run_command` and asserting argv tokens locks in a command that may not exist. Mock at the boundary — the subprocess or HTTP call — and assert on the *parsed result*.
- **Fakes that ignore the parameters under test.** A fake `list_items` returning all canned rows in one call cannot exercise the pagination those parameters drive.
- **Tests written around a bug.** Wrapping a call in `try/except` to make it pass documents the bug as acceptable. Assert the correct behavior and use `xfail(strict=True)` to track it without red CI.

## Prove the test can fail

Every regression test claims *this would have caught the bug*. Put the bug back and watch it go red — once, while the fix is fresh.

- **Mutate each half of a compound guard separately.** A fix that validates the input *and* re-checks the resolved path looks redundant until you revert each half alone: the first is caught by a `../../etc/passwd` test, the second **only** by a symlink inside the approved directory pointing out of it. A half whose removal leaves the suite green is a gap, not a redundancy.
- **Know what red looks like for your mutation.** Removing an iteration cap makes the suite *hang* — run it under `timeout 60 …`, where no output is the reproduction. Dropping an `await` may kill the worker rather than fail a named test. An error during *collection* means no test ran and you learned nothing.
- **Mutate in both directions.** A new conditional has two wrong implementations: never fires (the original bug) or always fires. The control test — a healthy run emits *no* warning — is the only one that catches the second, and it reads as vacuous, so name the pairing in the PR body or a reviewer deletes half the coverage. Over-firing is almost always `if not x:` where the intent was `if x is None:`; when adding a guard turns unrelated fixtures red, read that as the over-broad mutation reporting itself.
- **A hand-written fixture is a mutation of reality.** When the same person writes the parser and every fixture, both encode the same assumption and the guard cannot fire in production. Commit at least one fixture captured from the real source.
- **Pick fixture values that separate the two implementations.** If the buggy version produces the same number from your fixture, change the fixture, not the assertion — a single-row frame makes `.iloc[0]` and `.iloc[-1]` agree, and only a strictly increasing three-row one tells them apart.

## Security tests assert on output, not configuration

Don't assert that `install(show_locals=False)` was called — exercise the installed hook with a unique sentinel and inspect what it rendered, so a later refactor that re-enables locals is caught. Assert *both* that the exception rendered and that the sentinel is absent, or a bypassed output path makes the test pass vacuously.
