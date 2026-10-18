---
name: kru-grilling
description: Stress-test a plan, decision, or idea — one numbered frontier per run with recommended answers; return the round for the PM to answer on the next invocation.
disable-model-invocation: true
---

<!-- vendored from `mattpocock/skills` (v1.3.1, sha 24fe0ef) → `skills/grilling`. Plan/design stress-test — the engine under `brief` and the lead's Step 2.5 grilling judgment; also feeds `planner`'s input. Kept verbatim minus the Codex `agents/openai.yaml` metadata (unused here); re-sync: re-download from https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grilling/. -->

Interview the PM relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. **Return the round as this step's result** — the next invocation carries the PM's answers before you open the next frontier.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the PM answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the PM's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the PM for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the PM's: put each in the returned round.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. When the task asks to act on the settled tree, hand off to the skill that persists or builds — do not wait for a separate "confirm shared understanding" line unless the task requires it.
