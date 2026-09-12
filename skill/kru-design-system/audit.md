# audit — the rubric over a system that exists

Reads whatever the repo has — a generator, a hand-written stylesheet, a Tailwind `@theme` block — and stands alone: `create` need never have run.

Where no step rule is stated anywhere, infer one from the names far enough to locate the ladder, then **report the missing rule as a finding**. Writing an inferred rule into the file promotes one reader's guess to the authority every future value resolves against, which is the drift this pass exists to catch.

## Four findings, and no fifth

| finding | what it is | what it blocks |
|---|---|---|
| **no set** | a foundation with no closed ladder | everything downstream — the gate has nothing to resolve against |
| **no rule** | a ladder whose steps have no stated purpose | every future step choice — this is *what to build next* |
| **off-ladder** | a consumer spending a value that is no step, or a step from the wrong ladder — a fill token on a text line | nothing yet; it rots |
| **orphan** | a step nothing spends | nothing. Report it as a **question**: either a hole in the parts, or a ladder longer than the product needs |

An **off-ladder** finding that the repo's conformance gate would already catch belongs to the gate — report the gate's absence instead, once (`{KRU_HOME}/kru/references/ui-practice.md` → *The conformance gate*).

## Output

Findings first, **ordered by what they block**, each naming the screens or components it blocks. Then one line per foundation that is whole, so the reader can see all seven were checked.

Every finding is phrased as **the builder's next slice**, carrying the token name it would need: *the motion ladder has durations and no named transitions — nothing states which duration an entering overlay takes; add the four.*

**`nothing to add — dispatch` is one line, and is the expected answer** on a mature system. Manufacturing a finding to justify the pass costs a round trip through the lead.

## Done when

All seven foundations are read — the five ladders for set · rule · consumer, primitives and shells for their state sets — and every finding carries what it blocks and the slice that closes it.
