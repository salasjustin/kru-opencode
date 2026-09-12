---
name: kru-landed
description: The PR for this session's branch merged — verify it on GitHub, sync the base branch, retire the branch.
disable-model-invocation: true
argument-hint: "[pr number — omit for the current branch's PR]"
---

The user just watched their PR merge. Put the session back on the base branch, up to date, with the spent branch gone — then stop, so the next change starts from a clean base.

**Verify on GitHub, never with git.** A squash or rebase merge writes new commits, so the base contains none of the branch's SHAs: `git branch -d` refuses it as *not fully merged* and `git log main..<branch>` still lists every commit. Both are wrong about the same landed PR, and both are why people reach for `-D` blind. `state: MERGED` from the API is the only thing that knows.

**Local sync only.** Landing already happened on the remote. Nothing here merges, rebases, pushes, or force-anythings.

## Do

1. **Find the change.** `git rev-parse --abbrev-ref HEAD` for the branch. `$ARGUMENTS` names a PR number → use it; otherwise the current branch's PR:

   ```bash
   gh pr view --json number,title,state,headRefName,headRefOid,baseRefName,url
   ```

   Already on the base branch → there's nothing to retire; run step 5 alone and say so. No PR, no `gh`, or no GitHub remote → say which and stop.
2. **Verify it landed.** `state` is `MERGED`, or you stop: `OPEN` → still open, give the URL; `CLOSED` → closed without merging. This gate is what makes step 6 safe, and it is the entire skill — a `-D` on an unmerged branch deletes the only copy of the work.
3. **Guard local work** — `git fetch --prune`, then two checks, each stop-and-report:
   - `git status --porcelain` non-empty → uncommitted changes follow you across a switch or block it. List the paths and stop; commit or stash is the user's call, not yours.
   - local `HEAD` ≠ the PR's `headRefOid` → you hold commits the PR never contained. Name them (`git log --oneline <headRefOid>..HEAD`) and stop.
4. **Resolve the base** from the PR's `baseRefName` — the branch *this change* landed on, which beats a repo-wide default when they differ. Without a PR, `gh repo view --json defaultBranchRef`; `git symbolic-ref refs/remotes/origin/HEAD` is unset in most clones and errors rather than answering.
5. **Sync the base.**

   ```bash
   git checkout <base> && git pull --ff-only
   ```

   **`--ff-only` on purpose:** a plain `pull` onto a base that drifted locally (one commit made on `main` by accident) writes a merge commit and leaves the session on a base nobody else has. A refusal here is the finding — report the divergence and stop rather than routing around it.

   `git worktree list` shows the base checked out in another worktree → the checkout fails by design. Sync it where it lives (`git -C <that path> pull --ff-only`) and leave this worktree alone: removing the directory the session is standing in takes the cwd with it. Name the path and let the user leave it first.
6. **Retire the branch.** `git branch -D <branch>` — `-d` refuses a squashed merge, and `-D` is safe *here and only here* because step 2 proved the merge and step 3 proved nothing local is unaccounted for. Then `git fetch --prune` to drop the remote-tracking ref, whether or not the remote auto-deleted the branch.
7. **Confirm in one line** — PR number and title landed, base branch at its new short SHA, branch deleted. If a worktree or a diverged base is still outstanding from step 5, that's the second line.

## Don't

- Don't skip a guard to finish the job. Every stop in step 3 is the case where the delete loses work that exists nowhere else.
- Don't start the next thing. Syncing the base is the whole ask.
