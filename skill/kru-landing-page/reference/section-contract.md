# section-contract — the deck two agents mount

The output shape of `SKILL.md` → *5. Return the deck*.

## Who reads it

- **the designer** (standalone session, not the engineering lead) draws mockups around these strings. It needs the real copy, at real length, in final order — a wireframe drawn around lorem sizes to a different page.
- **the UI builder** mounts the strings verbatim into components.

Neither consumer reads for taste — the designer may be a person, but the deck is machine input. The deck therefore carries no rationale, no annotations and no alternatives — `copywriting` → *Output Format* produces those for a person, and they belong in the return's prose, outside the deck. Two headline options in a deck is a decision handed to an agent that has no basis to make it.

## Two load-bearing properties

**The deck is a closed set.** It is the whole page: what is in it ships, what is not in it does not exist. The builder mounts the exact strings. A section whose slot has no string comes back as a **named gap**, so that the builder mounts an empty slot rather than text it wrote to fill the hole.

**It is a contract, not annotated prose.** Every field is there because a downstream agent consumes it: `job` and `claim` tell the designer what visual weight a section is carrying, `proof` tells it what has to be visible near the claim, `copy` is mounted character-for-character, `cta` is wired. A field nothing downstream reads is prose and belongs in the return instead.

## Shape

```yaml
page: <slug>
path: <url path>
placement:                      # SKILL.md step 1
  awareness: <stage>
  sophistication: <1-5>
  evidence: <what placed it, or the gap>
position:                       # reference/positioning.md
  category: <the frame>
  alternative: <what they do instead>
  differentiator: <what this has that it doesn't>
budget: <section count, and the price/risk/temperature that set it>
gaps: [...]
sections:
  - id: <stable slug>
    job: <what this section does for the reader>
    claim: <the one assertion it asserts>
    proof: <the evidence attached to that claim, with its source — or `gap`>
    copy:
      <slot>: <verbatim string>
    cta:
      label: <verbatim button text>
      href: <destination>
```

| field | what it is | what downstream does with it |
|---|---|---|
| `placement` | the stage and level the deck was built for | the designer knows the hero is carrying identification, not a claim |
| `position` | the settled position the headline was cut from | nothing mounts it; it is what a later edit has to stay consistent with |
| `budget` | the section count and why | a section added later has to displace one |
| `id` | stable slug, never renumbered | the anchor, the component name, the gap's address |
| `job` | one clause, reader-facing | visual weight and section ordering |
| `claim` | the single assertion — the step-3 chain, one link per section. `null` only on a section that repeats an action already argued for, which is why a close carries no proof either | a section with two claims is two sections |
| `proof` | the evidence, **with its source**, or the literal `gap` | the designer places it inside this section, beside the claim |
| `copy` | slot → verbatim string. Slots are whatever the section has: `eyebrow`, `headline`, `subhead`, `body`, `items[]`, `label` | mounted character-for-character |
| `cta` | `label` + `href`, only where the section has one | wired |

## Worked example

```yaml
page: teams-upgrade
path: /teams
placement:
  awareness: product-aware
  sophistication: 3
  evidence: "linked only from the in-app 'invite a teammate' banner"
position:
  category: "shared inbox"
  alternative: "a forwarded mailbox plus a Slack channel"
  differentiator: "assignment state lives on the message, not in a second tool"
budget: "4 sections — $12/seat/mo, cancel anytime, warm in-app traffic"
gaps:
  - field: sections[proof].proof
    need: "one customer's before/after response time, with the customer's name"
    effect: "the 'nothing falls through' claim ships unproven"
sections:
  - id: hero
    job: "name the thing they already came for, and the mechanism that makes it different"
    claim: "assignment state belongs on the message"
    proof: "product screenshot — the assignee control on a thread"
    copy:
      headline: "Every message has an owner."
      subhead: "Assign a conversation to a teammate in the thread itself. No forwarding, no second tool to check."
    cta:
      label: "Add my team"
      href: "/settings/team/new"
  - id: mechanism
    job: "show the alternative failing, so the differentiator has something to be different from"
    claim: "a forwarded mailbox loses ownership the moment two people open it"
    proof: gap
    copy:
      headline: "Forwarding tells everyone. It tells no one whose it is."
      body: "Two people reply. One replies twice. Someone assumes the other has it. The customer waits."
  - id: objection
    job: "clear the one thing that stalls an in-app upgrade"
    claim: "switching costs nothing and is reversible"
    proof: "billing terms — monthly, prorated, cancel in settings"
    copy:
      headline: "Nothing moves."
      body: "Your existing conversations stay where they are. Billing is monthly and prorated; cancel from settings and the team plan ends at the period."
  - id: close
    job: "repeat the action with the risk already answered"
    claim: null
    copy:
      headline: "Add your team in about a minute."
    cta:
      label: "Add my team"
      href: "/settings/team/new"
```

Four sections, because the visitor is product-aware and the price is low and reversible: no problem section — they arrived feeling it — and no social-proof bar, because it would back a claim that hasn't been made yet.

## Naming a gap

```yaml
gaps:
  - field: sections[pricing].copy.tiers      # the exact address
    need: "the tier names, their prices, and what's in each"
    effect: "the comparison table has no rows; the section mounts with a heading only"
```

`field` addresses the slot, `need` says what fact would fill it and who has it, `effect` says what ships wrong without it.

**A gap blocks its claim, not the deck.** The run finishes: the section ships with the slot empty and the gap named, or — where the claim cannot stand unproven — the claim is cut and the section with it, and the gap records that a section was removed. Both are outcomes. Inventing the missing fact is not.
