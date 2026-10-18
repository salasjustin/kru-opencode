---
name: claude-code-delegation
description: "Delegating work to opencode. Use when handing off a build, fix, refactor or review, when choosing cloud or local headless, or before a merge that needs an independent review. Work that stays in this session is out."
user-invocable: false
---

# Delegating to opencode

opencode (`claude`) runs the work. Choose where that run happens, and hand it a complete brief.

## Where it runs

- **Cloud** (`claude --cloud "<task>"`) for a long or heavy build, a large refactor, a full test suite, or anything that can work from a pushed branch. Attach later with `claude --cloud <session_id or claude.ai/code URL>`, or resume with `--teleport`.
- **Local headless** (`claude -p "<task>"`) for a quick task, or work that needs files only on this machine, a login, a running local app, or a read of a local clone.

When the cloud reports an auth or plan error, run the work locally and review it locally, and report that the cloud needs a claude.ai login.

Done when the place matches the constraint the work actually has: a pushed branch can go to the cloud; a file, login or process that exists only locally stays on the machine.

## The brief

The task states the goal, the constraints, the done-check and the proof to return. That shape is [`reliable-work`](../reliable-work/SKILL.md).

## Review before merge

Before a merge, run `claude ultrareview [PR number | base branch]` from the clone. It is a cloud-hosted multi-agent review, independent of the builder. Fix each finding, or dismiss it with a reason, and put a short summary of the review in the merge request.

Done when every finding is fixed or dismissed with a reason, and the summary is in the request.

## After the run

Stop the local dev servers and processes the run started.

Done when those processes have exited.
