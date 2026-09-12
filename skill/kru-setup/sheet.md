<!-- The sheet's content and its renderings. `/kru/setup` writes this into a repo's
     `AGENTS.md` in that file's own idiom. What each line says is derived from the repo; how
     it is laid out is derived from the host file. A repo's copy is a cache the next re-run rewrites. -->

Two lines carry fixed wording, because each does a job its phrasing decides. **The pointer** — the
one line that makes the sheet act rather than sit, since a session that never loads `lead` has
answers and no practice:

```
Load **`kru-lead`** before building, reviewing, or dispatching a seat — it carries how the
team works.
```

And **the gate**, which decides what happens at the edge of those answers, since a nearby seat is
always available and an uncovered slice otherwise routes itself:

```
A slice reaching a stack no seat above covers is a question for the user, naming the seat it would
need — never a nearby seat pressed into the gap.
```

Everything between them is this repo's answers, one line per field, each citing what it was derived
from — a manifest entry, or on a blank repo the decision standing in for one (`← decided 2026-09-04 · /kru/setup`).

## Renderings

Match the host file. The same sheet, in the two idioms most files are already written in — an aligned
block for a file that reaches for code fences and tables:

```
routes     kru/react-router-builder     ← react-router 7.16.0 framework mode, fs-routes
ui         kru/react-ui-builder         ← packages/ui components, tailwind 4
data       kru/postgres-architect       ← drizzle-orm, apps/api/.server/pg/migrations
skills     kru-drizzle · zod · conform  ← drizzle-orm 0.44 · zod 4.1 · @conform-to/react 1.9
project    .claude/skills/db-admin · e2e        ← prefer these over a plugin seat
```

and bold-led bullets for a file written in prose:

```markdown
- **routes** → `kru/react-router-builder` — react-router 7.16.0 framework mode, fs-routes
- **ui** → `kru/react-ui-builder` — `packages/ui` components, tailwind 4
- **data** → `kru/postgres-architect` — drizzle-orm, `apps/api/.server/pg/migrations`
- **skills** → `kru-drizzle`, `zod`, `conform` — drizzle-orm 0.44, zod 4.1, `@conform-to/react` 1.9
- **project seats** — `.claude/skills/db-admin`, `e2e`; prefer these over a plugin seat where they overlap
```

Both read in one pass, which is the property to preserve when the host file's idiom is a third thing.

**`skills` stays one line** whatever the idiom — this repo's answered conditionals, each with the
manifest entry it came from (`{KRU_HOME}/kru/references/routing.md` → *Conditional skills*).

## The fields past the seats

A repo whose own always-loaded docs already carry its commands, its token file and the gate that
closes it **ends at the seats and their skills** — those are the repo's lines to state and the sheet's to leave alone.
Where one of them is genuinely unwritten anywhere, it joins in the same shape, with its evidence, in
whichever section of the host file already owns that subject:

```
tokens     packages/brand/src/colors.css      ← gate: lefthook test-brand (colors.ts ↔ colors.css)
⚠ suite    ~9 min cold, no watch mode         ← measured; no config states it
mcp        sentry · stripe (project scope)    ← claude mcp list; context7 + chrome-devtools at user scope
```

**`mcp` names only the servers this repo's seats depend on**, each at the scope it is registered at, with the
user-scope few named once as the set the repo inherits rather than repeated per seat.

A cost line is the one field with no file to read it off, so it is the one to be most careful about:
measure it or cite the config that sets it. A plausible cost asserted from the runner's reputation is
the failure this shape invites — the sheet is read as derived fact on every later session.
