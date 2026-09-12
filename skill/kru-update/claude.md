# claude — what shipped to opencode

opencode ships most weekdays, and a release can change the ground under a plugin. The installed CLI is the authority: a shipped entry can be gated to early access or to a plan the user isn't on, so a candidate is confirmed against `claude --version` and the binary (Step 5) before it earns a verdict.

## Do

1. **Find the mark.** `reviewed.md` → *opencode* → *Swept through*. `$ARGUMENTS` names a version → sweep back to that one instead.
2. **Get the releases.**

   ```bash
   curl -sL https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md -o <scratchpad>/CHANGELOG.md   # ~6k lines: save it, don't stream it into context
   claude --version
   ```

   Installed version below the newest entry → say so once: entries above it are announced, not yet running here.
3. **Cut to the unswept range** — everything above the mark's `## <version>` heading. Nothing above it → report *swept through <version>, nothing new* and stop.
4. **Keep only what touches the team.** An entry earns a read when it names one of these surfaces:

   | Surface | Where it lands here |
   |---|---|
   | agent frontmatter (`model` · `effort` · `tools` · `maxTurns` · `hooks` · `isolation` · `experimental.*`) | `agent/kru/*.md` |
   | skill / slash-command frontmatter (`disable-model-invocation` · `allowed-tools` · `context` · `background` · `argument-hint`) | `skill/kru-*/SKILL.md` |
   | plugin + marketplace manifest, install, loading, `{KRU_HOME}/kru` | `.claude-plugin/*.json`, README → *Install* |
   | subagent dispatch — concurrency caps, spawn depth, partial results, worktree isolation, a `task` call carrying the prior `task_id` | `lead` SKILL.md → Steps 3–4 |
   | the built-ins the team delegates to — `explore`, `plan`, `kru/code-reviewer`, `kru-tdd`, `kru-diagnosing-bugs`, `/verify`, `/run` | `lead` SKILL.md, `ROSTER.md` → *Reused, not owned* |
   | hook events and their payloads | `agent/kru/*.md` frontmatter, target-repo gates |
   | tool and permission names a seat lists | every `tools:` / `allowed-tools:` line |
   | MCP config for `chrome-devtools` and `context7` | README → *Requirements*, `SOURCES.md` |
   | model IDs, effort levels, prompt-cache knobs, pricing | `ROSTER.md` → *Model tiers* |
   | the `claude plugin` CLI (`details` · `validate` · `eval`) | `skill/kru-roster/audit.md` |

   Read the kept entries; the rest of the range is done.
5. **Confirm each candidate is reachable**, before it earns a verdict:
   - a **frontmatter key** — the binary carries the zod schema, which is the only place the exact shape and enum are written:

     ```bash
     R=$(readlink -f "$(which claude)"); grep -ao '.\{300\}<key>:.\{200\}' "$R" | head -1
     ```

     This is what separates `experimental:\n  cacheTtl: "1h"` from a key that parses and does nothing — `claude plugin validate` passes on any unknown agent key, so it answers a different question.
   - a **CLI subcommand** — run its `--help`. Early access replies `<feature> is currently in early access` and that is the verdict for this install.
   - a **built-in's behavior** — check what the team's own text claims about it, and correct the claim.
6. **Give every kept entry one verdict** (`SKILL.md` → *The verdicts*). The action verdict here is **Adopt** — the change is small, reversible, and the team's existing doctrine already argues for it. Say which line moves.
7. **Check the floor.** An adopted feature that needs a newer CLI moves README → *Requirements* → the **≥ version** line. Name the version and the feature that forced it.
8. **Record and report.** Rewrite `reviewed.md` → *opencode*: the mark to the newest version read, and one line per verdict under its bucket. Then report the buckets to the user and stop — they choose what gets wired, and `/kru/roster hire|author|learn` wires it.

