---
name: kru-propagate
description: Carry a plugin change out to every repo it reaches — the files `skill/kru-setup/SKILL.md` wrote, patched per repo and pushed only when the task explicitly approves the push.
disable-model-invocation: true
---

Run from the plugin source repo. A repo that ran `skill/kru-setup/SKILL.md` holds a copy of the plugin's guidance in the files setup wrote, and that copy stays at the stamp it was derived under. A release that changes the guidance reaches a repo only when someone carries it there — this skill carries one release to every repo at once.

**Its reach is what setup writes, and nothing else**: the sheet section in `AGENTS.md`, `.claude/cloud-setup.md`, the cloud install hook it registers, and the grants in `.claude/settings.json` (`{KRU_HOME}/skill/kru-setup/SKILL.md` names each). A change that needs the whole sheet re-derived — a new seat in the routing table, a rewritten bar — is `skill/kru-setup/SKILL.md`'s re-run in that repo; name it in the plan and patch nothing there.

## Do

1. **Name the delta.** The release comes from the version named in the task, else `VERSION`. Read `git log` and the diff from the oldest stamp among the repos (step 2) to that release, restricted to `skill/kru-setup/` and the files it points at, and write down each change as *the rule, and the reason it exists*. Completion: every hunk in that range accounted for — a change to what setup writes, or not.
2. **Find the repos.** Dirs named in the task, else every git repo beside this one (`../*/`), holding a setup stamp — `<!-- kru v` in `AGENTS.md` — or a `.claude/cloud-setup.md`. A stamp at or above the release is current; drop it.
3. **Read each repo's state before its files.** `git fetch`, then:
   - **the working branch** is the checked-out one, and it is not always the default — a repo whose work lives on a long-running branch takes its patch there
   - **a fix already made**: `git log --all -- <file>` for each target file. A cloud session pushes its own `claude/*` branch, and it may have made this exact change against real failure. That commit is the patch — cherry-pick it alone, never the branch's other commits
   - **uncommitted edits** to a target file are the user's work in flight: build on them, and commit them with the patch only when they're the same change. A different change in the same file stops that repo, named in the plan
4. **Check each change's reason against each repo, not its text.** A rule holds where its reason does. `/usr/local/bin` goes behind a pinned dir because the image's node 20 lives there; a repo whose setup script installs its own node into `/usr/local` has that reason gone, and the rule stays out. A reason you can't check from here — an install layout on a version this machine doesn't have, a vm behavior — leaves the repo's line as it is, and the plan says which and why.
5. **Plan, then return it.** One block per repo: branch, each file and the change in plain words, each change skipped with its reason, each repo that needs `skill/kru-setup/SKILL.md` instead. Pushing to someone's branch is a one-way door — **return the plan as this step's result** and apply only when the invoking task explicitly approves propagation (push included). Invocation alone is not approval.
6. **Apply per repo.** Edit, then check what you touched parses — `bash -n` on a script, and on a fenced block pulled out of `cloud-setup.md`. Stage the paths you edited by name; commit in the repo's own message style (read its `git log`); push to the working branch. A repo whose check fails is reverted and reported, and the rest go on.
7. **Bump the stamp on what you carried.** The setup script's `# kru vX.Y.Z` line moves to the release. It does two jobs: it records what the script was carried to, and it changes the script — and a changed setup script is what rebuilds the environment cache, the only way a cloud session loads a newer kru than its last snapshot held. The sheet's stamp moves only where every line under it is current; otherwise it stays and the repo is named for `skill/kru-setup/SKILL.md`.

## Report
Per repo: branch, commit, what landed, what was skipped and why. Then the part only the user can do: **paste each changed `cloud-setup.md` block into that repo's environment dialog** — the dialog holds its own copy, so nothing reaches a cloud session until it is pasted, and the pasted script is what rebuilds the cache.
