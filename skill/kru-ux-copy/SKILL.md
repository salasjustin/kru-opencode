---
name: kru-ux-copy
description: Microcopy, errors, empty states, and CTAs when the task names in-product strings, button labels, confirmations, or onboarding text to write or review.
user-invocable: false
---

<!-- vendored from the knowledge-work `design` plugin (design@knowledge-work-plugins v1.2.0, sha 15898ec).
     copied into the repo so the team keeps the skill without the plugin's ~9 auth-gated MCP servers
     (slack, figma, linear, asana, atlassian, notion, intercom, google calendar, gmail) loaded.
     upstream ships this as the namespaced `design:ux-copy`; this is the plain vendored copy.
     TEAM-ADAPTED: dead CONNECTORS.md pointer dropped, connector block rewritten as team equivalents
     (repo strings for voice, the design spec's screen inventory for context); error messages split field-level vs system-level, where upstream gives every error the what+why+how structure. re-sync: diff, then re-apply. -->

# UX copy

Write or review UX copy for any interface context.

## What I Need From You

- **Context**: What screen, flow, or feature?
- **User state**: What is the user trying to do? How are they feeling?
- **Tone**: Formal, friendly, playful, reassuring?
- **Constraints**: Character limits, platform guidelines?

## Principles

1. **Clear**: Say exactly what you mean. No jargon, no ambiguity.
2. **Concise**: Use the fewest words that convey the full meaning.
3. **Consistent**: Same terms for the same things everywhere.
4. **Useful**: Every word should help the user accomplish their goal.
5. **Human**: Write like a helpful person, not a robot.

## Copy Patterns

### CTAs
- Start with a verb: "Start free trial", "Save changes", "Download report"
- Be specific: "Create account" not "Submit"
- Match the outcome to the label

### Error Messages
**A field error is read with its label, so it carries the fault alone**: `EIN` / `required`. The label already names the field, and the requirement is not what the operator is deciding at that moment.

**A system-level error** stands alone, so it carries the structure: what happened + why + how to fix.
- "Payment declined. Your card was declined by your bank. Try a different card or contact your bank."

### Empty States
Structure: What this is + Why it's empty + How to start
- "No projects yet. Create your first project to start collaborating with your team."

### Confirmation Dialogs
- Make the action clear: "Delete 3 files?" not "Are you sure?"
- Describe consequences: "This can't be undone"
- Label buttons with the action: "Delete files" / "Keep files" not "OK" / "Cancel"

### Tooltips
- Concise, helpful, never obvious

### Loading States
- Set expectations, reduce anxiety

### Onboarding
- Progressive disclosure, one concept at a time

## Voice and Tone

Adapt tone to context:
- **Success**: Celebratory but not over the top
- **Error**: Empathetic and helpful
- **Warning**: Clear and actionable
- **Neutral**: Informative and concise

## Output

```markdown
## UX Copy: [Context]

### Recommended Copy
**[Element]**: [Copy]

### Alternatives
| Option | Copy | Tone | Best For |
|--------|------|------|----------|
| A | [Copy] | [Tone] | [When to use] |
| B | [Copy] | [Tone] | [When to use] |
| C | [Copy] | [Tone] | [When to use] |

### Rationale
[Why this copy works — user context, clarity, action-orientation]

### Localization Notes
[Anything translators should know — idioms to avoid, character expansion, cultural context]
```

## Where the team gets this instead of a connector
Upstream's connector hooks (knowledge base, Figma) aren't vendored — the plugin's MCP fleet is deliberately out. The equivalents:

- **Voice, terminology and existing patterns** — grep the repo's own strings first. A product's vocabulary is already in its components, and matching it beats inventing a better word for something users have already learned.
- **Screen context and the full flow** — the approved design spec's screen inventory and flows, plus the route/component files. Not a live Figma pull; there's no Figma MCP on this team.
- **Character limits and layout constraints** — the design plan or the returned design; where neither settles it, say the string is length-sensitive and give a short alternative rather than guessing a cap.

## Tips

1. **Be specific about context** — "Error message when payment fails" is better than "error message."
2. **Share your brand voice** — "We're professional but warm" helps me match your tone.
3. **Consider the user's emotional state** — Error messages need empathy. Success messages can celebrate.
