<!-- kru v0.148.0 · derived 2026-10-16 · /kru:setup to re-derive -->
## Team

Load **`kru:lead`** before building, reviewing, or dispatching a seat — it carries how the team works.

- **port + installer** → `kru:node-developer` — `scripts/port.mjs` (the upstream→opencode rewrites), `bin/kru-oc.mjs` (`install`/`doctor`), `scripts/gen-asset.ts`
- **opencode plugin** → `kru:extension-builder` — `plugin/kru.ts` (`@opencode-ai/plugin`), `hooks/*.sh`
- **agent docs** — `agent/`, `skill/`, `command/`, `references/`, `*.md` are ported prompts; edit them on `kru:writing-for-agents`, and route upstream-shaped changes through `scripts/port.mjs` (`PORTING.md` → *Hand-owned*)
- **verify** — `npm run check` (`port.mjs --check`); no test runner

A slice reaching a stack no seat above covers is a question for the user, naming the seat it would need — never a nearby seat pressed into the gap.
