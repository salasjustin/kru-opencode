---
name: kru-eval-review
description: Audit a `claude plugin eval` suite for checks that pass or fail for the wrong reason, and fix the eval files in place.
disable-model-invocation: true
---

A plugin eval is trustworthy when every grader can go **red** on the failure it names and stays green on every valid way of succeeding. A suite drifts off that by passing on the wrong evidence (the rule was read, not followed), crediting the wrong actor (the lead did what the seat was supposed to), or failing a correct answer written in a form the pattern didn't expect. This pass finds those and fixes them in the eval files; the plugin under test is out of scope.

The format is `code.claude.com/docs/en/plugin-evals.md` (fetch it; grader types, `target` values and the two-arm exclusions change with the CLI). The model-agnostic checklist, the one for any eval, is `shared/evals/eval-audit.md` inside the `/claude-api` skill. Run both; this file carries only what those two don't: the traps specific to grading an agent plugin from its trace. Every trap below was reproduced on Claude Code 2.1.284, 2026-09-29.

**Completion criterion:** every grader in the target has been shown red on a synthetic failing line and green on a synthetic passing one, and every finding is fixed or reported. Checkable: step 3's output names every grader that carries a pattern.

## Do

1. **Resolve the target**: the argument, else `evals/`, else the manifest's `experimental.evals`. Read every case's `prompt.md`, `case.yaml` and `graders/*.md`, and the suite's README if it has one.

2. **Read each grader against the traps.** Each is a class, not a phrasing:
   - **Read, not followed.** A `regex` over `target: trace` for a rule's own text passes when the seat merely loaded the skill, because the skill body lands in the trace. Grade the content of the seat's `Write`/`Edit` calls: anchor the pattern on `"name":"(?:Write|Edit)","input":\{[^\n]*` before the rule.
   - **Wrong actor.** `tool_used` counts calls from every agent in the run, lead and subagents alike, so "the seat loaded X" and "the lead loaded X" score the same. Each trace line carries the subagent's `"subagent_type":"<plugin>:<seat>"` after its content, so a `regex` ending in `[^\n]*"subagent_type":"<plugin>:<seat>"` pins the actor.
   - **One valid form only.** A follow check that names the SQL spelling (`PRAGMA foreign_key_check`) fails the seat that ran it through its driver (`db.pragma("foreign_key_check")`). Match the rule's invariant token, not a syntax.
   - **Vacuous pass.** `match: not_contains` and `max: 0` pass when nothing was written at all. Each needs a positive grader in the same case that fails on an empty run.
   - **Escaping.** Trace lines are JSON, so a quote inside written content is `\"` and the pattern needs `\\"`. A pattern built with `printf '%s'` keeps its backslashes doubled; read the final file, not the script that wrote it.
   - **One-directional set.** A routing suite needs cases where no seat should be dispatched (a typo the lead fixes inline, a stack no seat covers), or "always dispatch" scores perfectly.
   - **Leaked answer.** A prompt that names the seat, the skill or the fix measures whether the agent can read. Prompts state the symptom a user would report. A scaffold's fixture files are case input too: their comments are data, never a comment pass's target.

3. **Prove every regex can go red, for free.** Before any paid run, test each `regex` and `tool_used.input_match` with `node` against two synthetic trace lines per grader: one that must match (the right actor writing the right content) and one that must not (the rule text inside a skill-load line, or the right content under another `subagent_type`). A grader that matches both, or neither, is broken.

4. **Check the frontmatter loads.** An unquoted `: ` inside a `description` is invalid YAML; the run drops that case, prints one line at the top, and scores the rest. Count case directories against `casesTotal` in the last `aggregate-result.json`; a gap is a case that never ran.

5. **Read the failures before blaming the plugin.** A zero needs its trace, which a run keeps only with `--keep-temp`; without it the result JSON holds a `tracePath` that no longer exists. For each failed grader, read what the seat actually wrote. A correct answer the grader missed is a grader fix (step 2), and a real miss is a finding about the plugin, reported and left alone.

6. **Check the run shape.** `--ablation none` when the plugin *is* the capability (seats, agents): the no-plugin arm can't dispatch them, so its zero is by construction and `Δ` says nothing. `tool_used` on `Skill` is excluded from the score in two-arm mode, which silently turns a skill-loading suite into an unscored one. One run per case is a smoke read; a claim that a change helped needs the cases it touches at 3 runs, plus the cases that must not move.

7. **Fix what's in the eval files** (grader patterns, missing positive pairs, quoted frontmatter, a leaked prompt reworded to its symptom), then rerun step 3 over the changed graders.

8. **Report**, severity first: graders that can't go red, wrong-actor and read-not-followed passes, then missing directions and noise. A count per group, one line per fix, and the plugin findings from step 5 in their own section. Say which checks came back clean.

## Don't

- Don't start a paid run without explicit approval in the invoking task. Steps 1 to 4 cost nothing; return the planned run and stop. A full pass of an agent-plugin suite is dozens of real builds, counted against their plan's usage.
