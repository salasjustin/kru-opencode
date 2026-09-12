# vendored — what moved upstream of the copied skills

A vendored skill is a verbatim copy (`skill/kru-roster/author.md` → *Vendored*), so upstream keeps improving it without us: a corrected claim, a new section, a fixed reference — every one invisible here until someone diffs. The sha in the provenance comment is where the copy stopped; the diff against upstream's head is what counts.

## Do

1. **Enumerate the copies.** Every `skills/*/SKILL.md` that opens with a provenance comment, plus the rows in `SOURCES.md` → *Vendored resources* — a copy with no comment (`react-router`) has the row as its only pin. `$ARGUMENTS` names a skill → just that one.

   ```bash
   grep -H -o -m1 '<!-- vendored.\{0,400\}' skills/*/SKILL.md
   ```

   From each: the repo, the ref (branch or tag), the sha if one is recorded, the upstream path, and the recorded **deviations** — files excluded, lines re-applied after a re-sync. A directory that is in neither place is roster drift → note it for `/kru/roster audit` and move on. Done when every directory the `SOURCES.md` section names has a row in your list.
2. **Find upstream's head for that path.**

   ```bash
   gh api 'repos/<owner>/<repo>/commits?path=<upstream path>&sha=<branch>&per_page=1' --jq '.[0].sha[0:7] + " " + .[0].commit.committer.date'
   gh api 'repos/<owner>/<repo>/tags?per_page=5' --jq '.[].name'   # a tag-pinned copy (mattpocock v1.2.0): a newer tag is the candidate, not `main`
   ```

   Head equals the recorded sha, or no tag above the recorded one → **Current**; next skill. A copy with no sha has no shortcut — it diffs in Step 4 regardless.
3. **Cut to what the copy carries.**

   ```bash
   gh api 'repos/<owner>/<repo>/compare/<recorded ref>...<head>' --jq '.total_commits, (.files[].filename)' > <scratchpad>/<skill>-files.txt
   ```

   Drop every path outside the upstream path, and every path the comment excludes (`agents/openai.yaml`, `evals/`, `assets/`). Nothing left → **Current**, with the head as the new mark.
4. **Diff the rest against the copy**, file by file: fetch `raw.githubusercontent.com/<owner>/<repo>/<head>/<upstream path>/<file>` into the scratchpad and `diff` it against `skills/<name>/<file>`. The provenance comment and the recorded deviations show up as local-only hunks; everything else is the upstream change. The hunk is the evidence — a commit titled *typo* has carried a rewritten rule before. Done when every file left from Step 3 (or, with no sha, every file in the copy) has been diffed and its hunks read.
5. **Give each changed copy one verdict** (`SKILL.md` → *The verdicts*). The action verdict here is **Re-sync** — upstream changed content the copy carries; name the files, and the deviations `/kru/roster author <name>` re-applies after the download. Where the hunk lands on lines this team rewrote (`accessibility-review`, the `ux-designer` trio, the two `description` deviations in `writing-for-agents`) it is **Re-sync + re-adapt**: name both sides. *Consider* covers a rename, split or move upstream (`writing-great-skills` → `writing-for-agents` is the precedent), a sibling this team doesn't carry, a license change. *Decline* covers a cosmetic or Codex-only hunk, and one contrary to a deviation this team made on purpose.
6. **Record and report.** `reviewed.md` → *Vendored skills*: the sweep date, and one row per copy — recorded ref · upstream head · verdict, with the files and deviations a re-sync names. Report the rows and stop.

