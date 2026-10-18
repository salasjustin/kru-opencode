# Scoping a project from scratch

Loaded by `lead` when the branch is live.

1. The subject, audience, the one job and the stack are the sheet's — `skill/kru-setup/SKILL.md` grilled them on the blank repo (its step 1b). Read them there. UI greenfield defaults to React when the user states no preference; a stated stack wins.
2. Consider grilling (Step 2.5) before architecting.
3. Then spawn **`plan`** (built-in) for the architecture, scaffold, and route implementation (Step 3).

### UI from scratch — design upstream, system in the repo

A UI with no system yet is **not built and then designed in engineering**. The **PM attaches an approved design spec** — mockups + build spec from the designer (`{KRU_HOME}/kru/references/design-spec.md`). Without it, stop and tell the PM to get design first.

Engineering may run **`conversion-copywriter`** for a marketing first surface — the SECTION deck goes to the PM for the designer, not straight to builders.

Then the builder's **Phase 0** transcribes the build spec into the token file **and** ships the conformance gate → first components. **`{KRU_HOME}/kru/references/ui-practice.md`** carries bootstrap, steady state, system change, and team defaults.

### UI on an existing system — build to the spec

The **PM attaches the design spec** for the change. Route the UI builder with mockup + build spec pointers. **Named gap** → **PM** with the token name.

Steady-state loop: **`{KRU_HOME}/kru/references/ui-practice.md` → *Steady state*.**
