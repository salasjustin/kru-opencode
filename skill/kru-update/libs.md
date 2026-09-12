# libs — the packages the first-party skills were reproduced on

A first-party library skill is a set of runs on one specific version (`skill/kru-roster/author.md` → *What earns a skill*): the line beneath its frontmatter says which — *Reproduced on `pkg@x.y.z` (npm `latest`, date) with companions. Re-verify after a major|minor bump.* A release above that pin can turn a reproduced trap into a fixed one, and the skill then teaches a workaround for a bug that no longer exists, outranking the docs while it does. This sweep reads the registries and the release notes for the range, and names the claims a re-verification has to rerun.

## Do

1. **Enumerate the pins.** `$ARGUMENTS` names a skill → just that one.

   ```bash
   grep -H -o -m1 'Reproduced on \*\*`[^`]*`\*\*[^.]*\.' skill/kru-*/SKILL.md   # npm pins; companions follow "with"
   grep -H -m1 'Reproduced on \*\*[a-zA-Z]' skill/kru-*/SKILL.md              # toolchains — go, python (+ ruff, mcp, hatchling)
   grep -H -m1 '^As of 20' skill/kru-*/SKILL.md                               # dist-tag claims (drizzle, panda-css): what `latest` resolved to on a date
   ```

   From each line: the primary package, its companions, the date, and the skill's own **threshold** — *after a major bump* for most, *after a minor bump* where the skill says so (`conform`: its `future` half breaks on minors). A library skill with no such line can't be judged by this sweep → note it for `/kru/roster audit`. `modern-css` pins Baseline years, not a package; its own +30-months formula is its check, outside this sweep. Done when every first-party skill under `skills/` that names a package is on the list, with a pin or an audit note.
2. **Read latest, without installing.**

   ```bash
   npm view <pkg> version time.modified dist-tags --json
   curl -s https://pypi.org/pypi/<pkg>/json | python3 -c 'import json,sys;print(json.load(sys.stdin)["info"]["version"])'
   curl -s 'https://go.dev/dl/?mode=json' | python3 -c 'import json,sys;print(json.load(sys.stdin)[0]["version"])'
   curl -s https://endoflife.date/api/python.json | python3 -c 'import json,sys;print(json.load(sys.stdin)[0]["latest"])'
   ```

   Classify the delta against the pin — none · patch · minor · major — for the primary and then each companion: a Svelte or Kit major under `superforms` moves the ground as much as its own. The registry, not an install, is the read.
3. **Re-check the dist-tag claims on their own terms**: what `latest`, `beta`, `next` resolve to today against what the skill says they resolved to on its date. The Drizzle skill's premise is *`latest` is 0.45.x and orm.drizzle.team documents 1.0* — the day `latest` is 1.x that skill is not stale, it is wrong.
4. **Pull the release notes for the range** — nothing at or above the threshold gets a verdict from a version number alone.

   ```bash
   REPO=$(npm view <pkg> repository.url | sed -E 's#.*github.com/##; s#\.git$##')
   gh api "repos/$REPO/releases?per_page=40" --jq '.[] | "## " + .tag_name + " " + .published_at + "\n" + .body + "\n"' > <scratchpad>/<pkg>-releases.md   # save it, don't stream it; read down to the pin's tag
   ```

   A monorepo (`@conform-to/react` in `edmundhung/conform`, `vitest` in `vitest-dev/vitest`) tags per package or per repo — take the tags that carry the package's name where they exist, else the repo's `CHANGELOG.md`. Neither → Context7 (`resolve-library-id` → `query-docs` for the range) is the fallback.
5. **Grep the range for the skill's claims.** Every backticked identifier the skill names is a claim; every release line naming one is a candidate.

   ```bash
   grep -rhoE '`[A-Za-z_$][A-Za-z0-9_.$]*(\(\))?`' skills/<name>/ | tr -d '`()' | sort -u > <scratchpad>/<name>-ids.txt
   grep -nwF -f <scratchpad>/<name>-ids.txt <scratchpad>/<pkg>-releases.md
   ```

   Each hit → the skill line that claims it (`file:line`) and the release line that touches it. Read the hits; the rest of the range is done. The threshold settles the no-hit case: below it with no hits is **Current**; at or above it with no hits is still **Re-verify**, because the claims that break on a major are the ones release notes never mention — a removed default, a changed coercion.
6. **Give each skill one verdict** (`SKILL.md` → *The verdicts*). The action verdict here is **Re-verify** — name the claims (`file:line`) and the release entries that touch each; `/kru/roster author <name>` → *Refresh* reproduces those on the new version, edits what changed, and moves the pin. When the delta moves the skill's premise — a dist-tag claim flipped, a major that removes the API family the skill is built around — it is **Rewrite**: the skill goes back through `author.md`'s entry bar on the new version. *Consider* covers a new major that `latest` doesn't point at yet, and a reproduction long enough that the user schedules it. *Current* carries the version compared against. *Decline* covers a hit in a part of the package the skill scopes out (Zod 3 compat under `zod`, a `mini`-only change the classic half never claims).
7. **Record and report.** `reviewed.md` → *Libraries*: the sweep date, and one row per skill — pin · latest (date) · delta · verdict · the claims to re-verify. Report the rows and stop.

