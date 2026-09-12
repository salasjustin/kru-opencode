---
name: kru-research-synthesis
description: Synthesize user research into themes, insights, and recommendations. Use when you have interview transcripts, survey results, usability test notes, support tickets, or NPS responses that need to be distilled into patterns, user segments, and prioritized next steps.
argument-hint: "<research data, transcripts, or survey results>"
---

<!-- vendored from the knowledge-work `design` plugin (design@knowledge-work-plugins v1.2.0, sha 15898ec).
     copied into the repo so the team keeps the skill without the plugin's ~9 auth-gated MCP servers
     (slack, figma, linear, asana, atlassian, notion, intercom, google calendar, gmail) loaded.
     upstream ships this as the namespaced `design:research-synthesis`; this is the plain vendored copy.
     TEAM-ADAPTED: dead CONNECTORS.md pointer dropped, connector block rewritten as team equivalents, and the
     no-analytics rule made explicit — without supplied data, name what would confirm a theme rather than quantifying its impact.
     re-sync: diff against the plugin cache after a plugin update, then re-apply. -->

# /kru/research-synthesis


Synthesize user research data into actionable insights. See the **user-research** skill for research methods, interview guides, and analysis frameworks.

## Usage

```
/kru/research-synthesis $ARGUMENTS
```

## What I Accept

- Interview transcripts or notes
- Survey results (CSV, pasted data)
- Usability test recordings or notes
- Support tickets or feedback
- NPS/CSAT responses
- App store reviews

## Output

```markdown
## Research Synthesis: [Study Name]
**Method:** [Interviews / Survey / Usability Test] | **Participants:** [X]
**Date:** [Date range] | **Researcher:** [Name]

### Executive Summary
[3-4 sentence overview of key findings]

### Key Themes

#### Theme 1: [Name]
**Prevalence:** [X of Y participants]
**Summary:** [What this theme is about]
**Supporting Evidence:**
- "[Quote]" — P[X]
- "[Quote]" — P[X]
**Implication:** [What this means for the product]

#### Theme 2: [Name]
[Same format]

### Insights → Opportunities

| Insight | Opportunity | Impact | Effort |
|---------|-------------|--------|--------|
| [What we learned] | [What we could do] | High/Med/Low | High/Med/Low |

### User Segments Identified
| Segment | Characteristics | Needs | Size |
|---------|----------------|-------|------|
| [Name] | [Description] | [Key needs] | [Rough %] |

### Recommendations
1. **[High priority]** — [Why, based on which findings]
2. **[Medium priority]** — [Why]
3. **[Lower priority]** — [Why]

### Questions for Further Research
- [What we still don't know]

### Methodology Notes
[How the research was conducted, any limitations or biases to note]
```

## Where the team gets this instead of a connector
Upstream's connector hooks (feedback tools, analytics, knowledge base) aren't vendored — the plugin's MCP fleet is deliberately out. The equivalents:

- **Supplementary user input** — whatever the user pastes in, plus the plan store's `issues/` and `notes/` (`TRACKER.md`). Nothing is pulled from a support or NPS tool.
- **Quantitative validation** — only if the user supplies the data. **Without it, don't quantify impact** — say the theme is qualitative and name what would confirm it. An invented magnitude survives longer than the caveat next to it.
- **Prior studies** — research notes already in the repo or the plan store. The synthesis is returned to the user; it isn't published anywhere.
- **The lens is usability, not product.** Findings about *what to build* go back plainly for the user's next `brief` grill — they're the PM, and the team runs no prioritization pass.

## Tips

1. **Include raw quotes** — Direct participant quotes make insights credible and memorable.
2. **Separate observations from interpretations** — "5 of 8 users clicked the wrong button" is an observation. "The button placement is confusing" is an interpretation.
3. **Quantify where possible** — "Most users" is vague. "7 of 10 users" is specific.
