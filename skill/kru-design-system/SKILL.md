---
name: kru-design-system
description: The shape of a design system before its values exist — the seven foundations (color · typography · size · elevation · motion · primitives · shells) and whether each is whole. `create` writes that shape at bootstrap as source emitting a token file with every value `UNSET`; `audit` runs the rubric over an existing system and returns what has no set, what has no rule, and what spends a value off its ladder. Reach for it on a coverage read, or when the question is what a design system is missing rather than what it has.
argument-hint: "<create|audit> [influence…]"
---

# design-system — the shape, before the values

A token file answers *what values exist*. It cannot answer *what this system needs*, because it was written one component at a time and holds exactly what those components asked for. A system derived from its consumers is complete by construction and **blind** by construction: every hole in it is invisible from inside it. Whether it is **whole** is the one thing no repo can supply, and it is what this rubric answers.

Everything authored here is **shape**: a step count, what a step is for, the name it carries. The **values** that land in that shape arrive later, from the design (`{KRU_HOME}/kru/references/ui-practice.md`).

## A foundation is answered by set · rule · consumer

| | | a foundation missing it |
|---|---|---|
| **set** | the closed list of steps | has no system — every use invents, and the gate has nothing to resolve against |
| **rule** | what each step is **for** | has steps nobody can choose between |
| **consumer** | something in the tree spending it | has a token no screen proves, which is where the reverse rot starts |

**The rule is the half that goes missing**, and it is why a 12-step ramp beats six named colours: `--gray-6` gets picked by eye, while *the step a border takes at rest* is a decision any builder applies without asking. A set with no rule drifts inside its own token file and audits green the whole way.

Those three are also the finding names — `audit.md`.

## The seven, in order

**Ladders before parts.** A part is spent ladder steps, so a primitive audited before its ladders exist can only be judged on taste, and taste is the design's. The five ladders don't block each other — settle them in parallel. Primitives precede shells: a shell's padding and radius are stated against the control heights it contains.

### The ladders — closed sets of values

**color** — *set:* N steps per ramp × the ramps the product needs (neutral, accent, one per status the copy actually distinguishes). *Rule:* what each step is for, by role — app background · component background at rest/hover/active · border at rest/hover/focus · the solid fill · the ink that reads on it · low- and high-contrast text. The index **is** the job, so interaction is step arithmetic — a solid's hover is the next step along the ramp, its press the one beyond — and it inverts for free in dark mode, where a ladder named for lightness (50–900) has to be rewritten. A ramp declares only the steps something spends: a two-step status ramp is **whole**, not a stub.
**Default it corrects:** a palette declared straight into semantics (`--primary`, `--primary-hover`, `--primary-light`) with no ramp beneath. The fourth state anyone needs has no step to take, so someone reaches for a one-off `color-mix()`, and the **fill-vs-ink** distinction — the largest single source of drift — is unrecoverable from the values.

**typography** — *set:* the scale's steps and ratio, the faces by role, the weights actually loaded. *Rule:* every step is a **bundle** — size, weight, line-height, tracking bound under one name, plus the measure it's read at. A component spends a bundle.
**Default it corrects:** size and weight exposed as independent tokens, so *small bold* exists in nine slightly different forms, none named, and line-height gets set per component by whoever last noticed it was tight.

**size** — *set:* one base unit and **five ladders** kept separate — space · radius · control height (density) · icon (the box, and the stroke the set is drawn at) · container + breakpoint. *Rule:* which ladder a value comes from — padding from space, a control's height from density.
**Default it corrects:** one spacing scale doing all five jobs. A 40px control height and a 40px gap become the same token, so retuning density silently retunes every gap in the product and neither can be renamed.

**elevation** — *set:* the separation levels, each a **bundle** — border width, fill step, shadow — that a surface takes to sit above the one beneath it (flush · raised · overlay · modal). *Rule:* which level by nesting depth, and by whether the surface sits in the page's flow or over it — a card is in it, a popover is over it.
**Default it corrects:** a shadow scale (`sm` → `2xl`) with nothing saying which surface takes which. Depth gets picked by eye, and border-versus-shadow — the same separation done two ways — lands one way on the card and the other on the popover, so the two never read as the same depth and neither can be retuned.

**motion** — *set:* the durations, the easings, and the **named transitions** binding a duration to an easing for a purpose (state change · enter · exit · emphasis). *Rule:* which named transition by what is moving — a colour swap is not an entering overlay — and reduced-motion resolves once, inside the token.
**Default it corrects:** `transition: all 0.2s ease` written per component. It never becomes a token, so motion can't be retuned or audited, and `all` animates properties nobody intended.

### The parts — closed sets of components

**primitives** — *set:* the controls the product cannot be built without: button, link, input, textarea, select, checkbox, radio, switch, badge, icon, avatar, spinner. *Rule:* the state set each carries — rest · hover · focus-visible · active · disabled · loading · invalid · read-only — and which of them a given control has.
**Default it corrects:** the state set designed once, for the button, and inherited nowhere. The input gets rest and invalid, the select gets rest, and the first screen that disables a select invents what that looks like.

**shells** — *set:* the containers everything sits inside: card/panel, dialog, sheet, popover, page shell + nav, section, list/table row. *Rule:* which **elevation** level each container takes at each nesting depth, and that **a shell owns its padding and radius while its contents own none**.
**Default it corrects:** padding set on the card in one screen and on the card's children in the next. Both render; composing them doesn't, and no gate catches it because every value used was on-system.

## Dispatch

| `$ARGUMENTS` | the branch | read |
|---|---|---|
| `create [influence…]` | bootstrap — nothing is built yet, and the shape is the direction and the constraints | `create.md` |
| `audit` | a system already exists, in any form — a generator, a stylesheet, a `@theme` block | `audit.md` |

`ui-designer` runs `audit` on its coverage read, ahead of the element half of `design-system.md`.

## The bounds both verbs hold

- **Shape, never value.** A hue, a face, a px or an easing curve in a return is the failure — the look is settled on a canvas in front of the user, and it ships as authored.
- **Structure, never taste.** What either verb settles or reports is a set, a rule, a step's purpose, or a value off its ladder. Which values were chosen is the design's.
- **Contrast is recorded, never computed.** Which pairs the system settled as legible belongs in the ledger; a ratio derived here to overturn a design does not, and no seat on this team computes one.

## Owned elsewhere

- **The values and the look** — the design turn (`kru/ui-designer`), transcribed once by a builder; the verdict is the user's glance.
- **Whether a consumer resolves to the token file** — the repo's conformance gate, at every commit (`{KRU_HOME}/kru/references/ui-practice.md` → *The conformance gate*).
- **What components exist and what they render** — `/kru/design-gallery`, on the app's own dev server.
- **The rendered states and widths** — `/kru/visual-review`.
- **Flows, IA, the screen × state inventory, the conventions file** — `ux-designer`.
- **How a component behaves** — `ui-patterns`, design-system agnostic by construction.
