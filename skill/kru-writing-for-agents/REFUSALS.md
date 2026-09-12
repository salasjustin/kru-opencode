<!-- repo-owned, not vendored: the refusal branch of `writing-for-agents`, sourced from context-mode ADR-0002 + ADR-0003 (github.com/mksglu/context-mode, docs/adr/). Survives a re-sync of SKILL.md unchanged; SKILL.md's pointer to it is deviation (3) in that file's vendoring note. -->

# Writing a refusal

The refusal branch of [`writing-for-agents`](SKILL.md): what changes when the text is a gate's — a hook's block message, a tool's error, a validator's complaint — read mid-run by an agent that picks its next move from it. Everything else about writing it is the universal reference in `SKILL.md`.

## 301, not 403

Every refusal is one of two things, and classifying it is the first act of writing it, because the register follows the classification:

- **301** — the action is supported, by another route, and the gate knows the route.
- **403** — the action is denied, and stopping to tell the human is the correct next move.

Write each in its own register, and never spend 403's vocabulary on a 301. _Blocked_, _forbidden_, _restricted_, _not permitted_ read as policy, and an agent that believes it hit policy stops trying: it abandons a route that was open the whole time rather than take the one you handed it. context-mode shipped a routing redirect worded `webfetch blocked`; Opus 4.6 read it as a network restriction and fell back on its training data instead of calling the alternative tool named in the same sentence.

A 301 carries three things:

- **The redirect verb** — _redirected to_, _refused — use_, _handled by_.
- **The next call, as an imperative**, with its real arguments: `Call ctx_fetch_and_index(url, source)`, not "consider the fetch tool".
- **The capability, affirmed**, wherever the plausible misread is that it's gone: `ctx_fetch_and_index has full network access`.

It leaves out the rationale. HTTP's own 301 carries `Location:` and never appends _for SEO efficiency_ — the verb and the target are the entire action signal, and *why* the redirect exists changes nothing the agent does next: the no-op test under *Pruning*, failing on a whole clause.

A 403 inverts all of it: name the rule that fired, and stop. The heavy words are accurate here, and softening them invites the retry you are refusing.

## Replace the word, never append a denial

When a gate is being misread, the repair is the wrong word itself. Appending _(this is NOT a network restriction)_ to the `blocked` message above measured worse than shipping the bare wrong word — *Leading words* → **Negation**, arriving at the one site where you are most tempted to break it, because a misread feels like something you can argue the agent out of.

The positive form of a disclaimer is an affirmation of what is true. Not "this is not a restriction" — `the tool has full network access`. Same information, no elephant.

## The heavy register is a tool, not a smell

Forbidding language is wrong for routing and right elsewhere, so grade it per surface rather than sweeping it out. context-mode's audit found `DESTRUCTIVE` on a wipe-the-knowledge-base tool held small models to its argument contract, where the same register on a routing tool degraded selection. Where the heavy word is accurate signal about **consequence**, it is doing real work; where it is a nudge dressed as policy, it is the 403-for-a-301 above.
