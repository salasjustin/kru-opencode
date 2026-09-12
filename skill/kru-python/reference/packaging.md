# Packaging and distribution

A green build tells you the backend ran, never that the wheel contains your code. Reproduced with **hatchling** via `uv build` on 2026-09-02.

## A wheel that builds green and ships nothing

Build backends select files from config — hatchling's `[tool.hatch.build.targets.wheel]` (`only-include` / `packages` / `include`), setuptools' `[tool.setuptools.packages.find]`. Get it wrong and the backend cheerfully ships a wheel missing subpackages and data files, with no error:

```toml
# DON'T — over-narrow selection
[tool.hatch.build.targets.wheel]
only-include = ["src/probepkg/__init__.py"]
sources = ["src"]
```

`uv build --wheel` reports `Successfully built`, and the wheel holds exactly four entries: `probepkg/__init__.py` and the three `dist-info` files. `probepkg/sub/` is gone, so the package's own `from .sub.deep import real_func` raises `ModuleNotFoundError` for every installer. **`twine check` passes** — it validates metadata, not contents (the run emitted only cosmetic `long_description` warnings).

```toml
# DO — name the package and let the backend walk it
[tool.hatch.build.targets.wheel]
packages = ["src/my_pkg"]
```

## Inspect the artifact, then install it clean

```bash
uv build
python -m zipfile -l dist/*.whl        # every subpackage and data file, or it isn't shipping
```

Then prove it from outside the source tree, because `sys.path` will otherwise hand you the repo:

```bash
uv venv /tmp/verify && uv pip install --python /tmp/verify/bin/python dist/*.whl
cd /tmp && /tmp/verify/bin/python -c "import my_pkg; my_pkg.submodule.real_func"
```

Assert a **real symbol**, never that the bare top-level name imports — `import foo` succeeds against a shadowing empty package and proves nothing, which is why a CI smoke test of `import foo; print("ok")` is a false green. Exercise each console script (`mycli --help`) too; an entry point is the other thing a clean install can break.

## Direct-reference dependencies need a real build

A dependency such as `toolkit @ https://example.com/toolkit.whl` can resolve in an install dry run without ever invoking the build backend. With hatchling the real wheel build then fails unless direct references are allowed:

```toml
[tool.hatch.metadata]
allow-direct-references = true
```

So `uv pip install --dry-run .` is not the packaging check for this case — it reports success without building. Run `uv build`, then `twine check`, then the clean install above.

## Name collision

`SKILL.md`'s shadowing trap is a *distribution* failure as much as an import one: a wheel built from a tree holding both `foo.py` and `foo/` ships the near-empty package, so the console entry point `foo = "foo:main"` fails for everyone who installs it. Pick one name — usually the package — before you build.

## Dependency declarations

- **Minimum versions, not exact pins.** `requests>=2.28` in a library; `requests==2.28.1` locks every consumer. Applications lock in the lockfile, not in `dependencies`.
- **Optional features go to extras** (`[project.optional-dependencies]`), so a CLI's `click` isn't imposed on a library user.
- **Pin the build-gating tools** — linter, formatter, test runner, toolchain — so an upstream release doesn't flip an unrelated PR from green to red.
- **Package data is declared**: `py.typed` ships only if the config includes it, and a library without it gets no type checking downstream however complete its annotations are.
