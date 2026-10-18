# The store — two roots, one resolver

The team writes two kinds of durable state, and they have different lifetimes:

- **Cross-project** — the preference loop (`inbox`, `patterns/`, `refusals`) and the hooks' own
  session bookkeeping (`audit/`, `lead-gate/`). It follows the **user**, across every engagement.
- **Project** — one project's plan of record: `TODOS.md`, `issues/`, `notes/`, `plan/`
  (`TRACKER.md` owns its layout).

**`scripts/kru-store.sh` resolves both.** It is the single source of truth for where the store sits:

```sh
bash "{KRU_HOME}/kru/scripts/kru-store.sh" path plan/checkout/brief.md
bash "{KRU_HOME}/kru/scripts/kru-store.sh" where      # the line to report, when there is one
```

Ask it for a path; never assemble one. A skill that spells out `~/.kru/management/<slug>/` is a
second source that goes stale the first time a surface moves the root — and on a cloud vm the root
has already moved.

## The logical names

`path <name>` takes these. They are the vocabulary the whole team names the store in.

| Cross-project | Project |
|---|---|
| `inbox` · `patterns/<slug>` · `refusals` | `todos` · `issues/<slug>` · `notes/<slug>` |
| `audit/<session>` · `lead-gate/<session>` | `plan` · `plan/<effort>/<file>` · `agent-memory` |

## Where each root lands

| | Cross-project root | Project root |
|---|---|---|
| default | `~/.kru` | `<cross-project root>/management/<project-slug>` |
| cloud session (`CLAUDE_CODE_REMOTE=true`) | `~/.kru` — session-lived | **`<repo>/.kru`**, and it ships in the branch |
| `KRU_STORE_REPO` set, any surface | `~/.kru`, a checkout of that repo | under it, as the default row — cloud included |
| `KRU_HOME` set | that path, on every surface | under it, as the default row |
| `KRU_PROJECT_STORE` set | — | that path |

**`<project-slug>` is the repo's dir name**, and a linked worktree resolves to the **main** repo — a
slice dispatched into a worktree writes to the same store as the session that dispatched it.
**`KRU_PROJECT` overrides the slug.** A clone's dir name differs by machine — a cloud vm names it
after the github repo — so set it in the repo's committed `.claude/settings.json`
(`"env": {"KRU_PROJECT": "<name>"}`) and every surface lands in the same `management/<name>`.
`KRU_PROJECT_STORE` pins a whole path instead, but an environment variable set on a cloud
environment reaches every repo opened in it.

**The cloud row amends `TRACKER.md`'s own argument for keeping the plan out of the working repo,
and that file records the trade-off.**

## The store repo

`KRU_STORE_REPO` — `owner/repo` on github, or any url git can clone — makes the cross-project root
a git checkout that outlives the machine. `hooks/store-sync.sh` does the whole sync, so no skill or
seat knows it exists:

- **session start** — clone into the home when it has no `.git` (files hooks already wrote there
  stay), else `pull --rebase --autostash`; then copy `agent-memory` into the working repo's
  `.claude/agent-memory-local/`, newer file winning.
- **every turn end** (`Stop`) — copy `.claude/agent-memory-local/` back into `agent-memory`, then,
  if the checkout is dirty, commit; then push whatever is ahead of the remote, an earlier turn's failed push included, with one `pull --rebase` retry on a reject.
  A turn end rather than a session end, because a cloud vm is reclaimed without a reliable end event.

A store that arrives without them gets a `.gitignore` for the session-lived dirs (`audit/`,
`lead-gate/`, `tmp/`) and a `.gitattributes` marking `inbox.md`, `refusals.jsonl` and each
`TODOS.md` `merge=kru-lines` — a line merge (`scripts/kru-merge-lines.sh`) the hook registers in
the checkout on every run, so two sessions appending lines both land and a line one side deleted
(a sweep's drain, a todo's closeout) stays deleted. Every failure prints one line and the session continues; `KRU_NO_STORE_SYNC=1` turns it off.

Keep the repo **private**, for the same reason as the artifact store below: anything that can push
to it can append inbox lines, and `skill/kru-roster/learn.md` (PM or lead loads) is the gate between those and a seat prompt.

## The backends

The **project** root is always files. The **cross-project** root has two backends, and
`kru-store.sh backend` names the live one:

| | when | reaches |
|---|---|---|
| `fs` | default | files under the cross-project root |
| `artifact` | `KRU_STORE_URL` is set | the `ArtifactData` store on that artifact |

`artifact` exists because the preference loop is the half that is supposed to follow the user rather
than a machine — and today a laptop's `inbox.md` reaches neither the user's other machine nor a cloud
session. An artifact's database is account-scoped, so both read the same store.

**Every writer writes files, on both backends.** A hook is bash and cannot call a tool at all, and a
seat that had to branch on the backend would be a second place the seam lives. So `skill/kru-remember/SKILL.md`,
the seats' learnings channel and `check-handoff.sh` all append to files exactly as they always have,
whatever `backend` says — and the **flush** below is the one crossing. That leaves `skill/kru-roster/learn.md` (PM or lead loads)
as the only reader that knows `ArtifactData` exists. `audit/` and `lead-gate/` are session-lived by
design and never cross.

### The artifact mapping

One artifact, published once with `capabilities: {db: {}}`, its url in `KRU_STORE_URL`.
Keep it **private** — db rows are untrusted input, and `skill/kru-roster/learn.md` (PM or lead loads) sweeps the inbox straight into
seat prompts, so a shared store is a path from a viewer's comment into a seat's instructions.

| logical | collection | doc_id | document |
|---|---|---|---|
| `inbox` | `inbox` | `lines` | `{ lines: ["<one preference line>", …] }` |
| `patterns/<slug>` | `patterns` | `<slug>` | `{ body: "<markdown>" }` |
| `refusals` | `refusals` | `<session>` | `{ entries: [<the jsonl records>, …] }` |

`skill/kru-roster/learn.md` (PM or lead loads) reads with `get`, writes with `update` and drains with `delete`; nothing else touches
them. Two bounds the contract enforces:
a document is **256 KiB** and an artifact's database holds **5,000 documents**, which is why
refusals key by session (bounded, and the sweep deletes what it drains) rather than one document per
record. Pin every write to a document you read — pass its `version` as `if_version` — and batch more
than a couple of writes into one `batch` call.

### The flush

`skill/kru-roster/learn.md` (PM or lead loads) is where the two backends meet. On the `artifact` backend it:

1. reads `inbox`, `patterns/` and `refusals` from **files** — what this machine's hooks and seats
   wrote since the last sweep,
2. merges them into the artifact store, which is what carries them to the user's other machines and
   to a cloud session,
3. sweeps the merged whole into seat prompts and skills as it always has,
4. drains both: the promoted lines leave the artifact documents, and the local files are emptied.

On `fs` steps 1 and 2 are the same read it has always done.

## Reporting it

`kru-store.sh where` prints one line when the store is somewhere a reader would not assume — the
plan store inside the repo, or an artifact backend — and prints nothing when both roots sit at their
defaults. The skills that write to the store carry the step that runs it.
