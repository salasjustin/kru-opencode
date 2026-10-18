# Panda 1 → 2

- **Presets stop arriving implicitly.** A v1 config with no `presets` key got `@pandacss/preset-base` + `@pandacss/preset-panda` for free; v2 adds none (SKILL.md → *A config without `presets` emits garbage*). List both in `presets` **and** install both as their own devDependencies — `@pandacss/dev` no longer pulls them in.
- **`@pandacss/cli` brings `@parcel/watcher`, whose build script pnpm blocks** (`ERR_PNPM_IGNORED_BUILDS`) until `allowBuilds` in `pnpm-workspace.yaml` names it. `false` is enough: the platform prebuilt (e.g. darwin-arm64) ships as an optional dependency.
- **`panda codegen` without `--clean` leaves v1's `styled-system/*.mjs` beside v2's output**, and the stale `.mjs` resolves first. Wire `--clean` into the `build`/`prepare` script that runs codegen.
- Upstream's own checklist: `https://panda-css.com/docs/get-started/upgrading-to-v2`.
