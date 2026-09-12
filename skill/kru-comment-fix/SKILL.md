---
name: kru-comment-fix
description: Audit the comments in a target — working tree, path, branch or PR — and fix them in place.
disable-model-invocation: true
argument-hint: "[<path> | <branch> | <pr number> — omit for the working tree]"
---

Comments are the deliverable and the only thing that moves. The house standard, in one line: **a comment is lowercase, written for the next person to read the code, and never for the person who asked for the change.** An agent-written diff drifts off that standard in two directions at once — it adds notes addressed to the prompter, and it drops the notes that were already there.

**Every hunk in the resulting diff is a comment line.** No code moves, nothing reformats, no imports churn. That's the completion criterion, and it's checkable: read `git diff` at the end, and revert anything else the pass or a formatter touched.

## Do

1. **Resolve the target** from `$ARGUMENTS`:

   | argument | scope |
   | --- | --- |
   | *(none)* | the working tree — `git diff HEAD`, plus untracked files |
   | a path or glob | those files, whole |
   | a branch name | `git diff <base>...<branch>` — three dots, the branch's own work, not what the base did meanwhile |
   | a number | a PR: `gh pr checkout <n>` first (fixing needs a working tree), then its three-dot diff |

   **A diff target audits what the change wrote, not every comment in the files it grazed.** Restyling a file's existing comments because a two-line diff passed through buries the change under noise nobody asked for. A path target is the one that means whole files — because the user named them.
2. **Read the hunks.** Comments are found by reading, not by pattern: a grep for `//` hits every URL in the file, `#` hits every fragment and every shell string, and `/*` hits a regex literal. `git diff -U0` narrows a large target to the changed lines.
3. **Cut what the file shouldn't be carrying.** Each is a class, not a phrasing:
   - **Narration** — *added error handling*, *changed from X to Y*, *as requested*, *NEW:*, *this fixes the bug*, and the decision record — *a throw here beats a cast because…* — that argues for the chosen form over an alternative. A note addressed to whoever asked. The commit is where the change is explained; the file has no memory of the request.
   - **Restatement** — the comment says what the line says (`// increment the counter`), what the type checker already enforces (*must match the sdk* on a literal typed to one value), or what `package.json` / the lockfile already records (a dependency version). Pays a line, adds nothing, and goes stale the moment the line changes.
   - **Archeology** — *previously we used X*, a compat note naming something no longer in the repo, or a transition date (*became X at 2024-04-10*) the code is past — say what the default *is*.
   - **Elsewhere** — the comment describes state that lives in another file, a dashboard, or a setting (*the webhook endpoint pins api_version …* in the client). Written for a reader who isn't in this file, stale when that other thing moves. Move it to where that reader is, or to the plan store.
   - **Commented-out code** — delete it. git has it.
   - **Position markers** — a section banner (`// ---- helpers ----`) or a closing-brace tag (`} // end try`) marks structure a named extraction should carry. Cut the reflexive ones; a banner survives only where the grouping is real and the file already leans on the convention. The extraction the marker implies is code and out of scope — name it in the report instead.
   - **Stale** — the comment describes behavior the code no longer has. Rewrite it to the truth, or cut it. A wrong comment outranks the code in the reader's head, which is why it's the worst line in the file. A comment imprecise from its first commit (*returns when closed* on a method that really waits a timeout and throws) is stale one commit early — exact, or absent.
4. **Keep, always:**
   - **Anything answering *why*** — the constraint, the ordering that matters, the bug a workaround exists for, the value chosen after the obvious one failed. Chatty-and-load-bearing beats terse-and-gone: when a *why* comment reads badly, tighten the wording and leave the fact.
   - **Directives** — `eslint-disable-next-line`, `@ts-expect-error`, `biome-ignore`, `# noqa`, `# type: ignore`, `@vite-ignore`, `prettier-ignore`, shebangs, license headers, `Code generated … DO NOT EDIT` banners. These are API, not prose; lowercasing or rewording one silently turns a tool off.
   - **Doc comments on an exported surface** — JSDoc/TSDoc/docstrings carry their own conventions (capitalized sentences, `@param`). Correct them for accuracy; leave the case.
   - **Vendored and generated files** — not yours to restyle.
5. **Restore what the change dropped.** The other half of the standard: moving or refactoring code preserves its comments. Read the target's deletions — a comment that vanished while its code moved goes back at the code's new home. A comment left heading code inserted between it and its line is orphaned the same way — move it back down to its line. A comment deleted *with* the code it described is correctly gone.
6. **Lowercase the prose that's left** — inline explanatory comments only, with step 4's keeps exempt. Edit only what the language's own comment syntax opens: a `//` inside a string, a template literal, or JSX text is not a comment.
7. **Delete the whole construct, not the text inside it.** A JSX comment is `{/* … */}` — dropping the inner half leaves a stray `{}` in the tree. Same for Svelte/HTML `<!-- … -->` and a block comment's closing line.
8. **Report.** One line per edit, grouped *cut* · *restored* · *reworded*, each with `file:line`. Then the diff check from the top of this file, in a line: what moved, and that it was comments only.

## Don't

- Don't touch code, formatting, or naming — a fix that "while I was in there" reflowed a function makes the comment pass unreviewable.
- Don't run the formatter, the linter, or the build afterwards. Nothing here can break them, and their diff hides yours.
