---
name: kru-accessibility-review
description: WCAG 2.1 AA accessibility audit of a design or page — keyboard navigation, focus order, touch target size, screen reader/ARIA. Color contrast is the design's, and is audited nowhere on this team. Report-only unless fixes are asked for.
disable-model-invocation: true
argument-hint: "<URL, page/component, or description>"
---

<!-- vendored from the knowledge-work `design` plugin (design@knowledge-work-plugins v1.2.0, sha 15898ec).
     copied into the repo so the team keeps the skill without the plugin's ~9 auth-gated MCP servers
     (slack, figma, linear, asana, atlassian, notion, intercom, google calendar, gmail) loaded.
     upstream ships this as the namespaced `design:accessibility-review`; this is the plain vendored copy.
     TEAM-ADAPTED, not verbatim: color contrast (1.4.3, 1.4.11) removed from the criteria, the common issues,
     the testing approach, the output template and the tips — the design is authoritative on colour, so no
     review pass on this team computes or re-derives a ratio.
     re-sync: diff against the plugin cache after a plugin update, then re-apply. -->

# /kru/accessibility-review

Audit a design or page for WCAG 2.1 AA accessibility compliance. This is the team's a11y gate — the sibling of the `/kru/visual-review` (rendered states + cause) pass. Run it after a page/component is built and rendered.

**Contrast is the design's and ships as authored — no seat on this team computes a ratio**, so you audit everything else. What is still reportable is **breakage**: text over image, video, gradient or translucency with no scrim, reported as unreadable rather than as a number. Name 1.4.3/1.4.11 as unassessed in *what wasn't verified*: with them out, this audit is never a full-AA claim.

## Usage

```
/kru/accessibility-review $ARGUMENTS
```

Audit for accessibility: @$1

## WCAG 2.1 AA Quick Reference

### Perceivable
- **1.1.1** Non-text content has alt text
- **1.3.1** Info and structure conveyed semantically
- *(1.4.3 / 1.4.11 contrast — the design's call, **not assessed here or anywhere on this team**)*

### Operable
- **2.1.1** All functionality available via keyboard
- **2.4.3** Logical focus order
- **2.4.7** Visible focus indicator
- **2.5.5** Touch target >= 44x44 CSS pixels

### Understandable
- **3.2.1** Predictable on focus (no unexpected changes)
- **3.3.1** Error identification (describe the error)
- **3.3.2** Labels or instructions for inputs

### Robust
- **4.1.2** Name, role, value for all UI components

## Common Issues

1. Missing form labels
2. No keyboard access to interactive elements
3. Missing alt text on meaningful images
4. Focus traps in modals
5. Missing ARIA landmarks
6. Auto-playing media without controls
7. Time limits without extension options

## Testing Approach

1. Automated scan (catches ~30% of issues)
2. Keyboard-only navigation
3. Screen reader testing (VoiceOver, NVDA)
4. Zoom to 200% — does layout break?

When a dev server is running, prefer **measured** evidence over eyeballing — drive the live app via the `local-browser` skill (`chrome-devtools` MCP) and read real values with `evaluate_script` (`getBoundingClientRect` for touch-target size, tab order via focus events, computed styles for the focus indicator). `lighthouse_audit` (`mode: "snapshot"`, or `"navigation"` for a fresh load) sweeps the automatable criteria in one call — treat its output as a lead list, not the audit: it catches missing names and roles, and it cannot see focus order, keyboard traps, or whether a target is big enough to hit. **Every measured number on a rendered page is this pass's** — `/kru/visual-review` hands target sizes here rather than tabling its own.

## Output

```markdown
## Accessibility Audit: [Design/Page Name]
**Standard:** WCAG 2.1 AA | **Date:** [Date]

### Summary
**Issues found:** [X] | **Critical:** [X] | **Major:** [X] | **Minor:** [X]

### Findings

#### Perceivable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | [Issue] | [1.1.1 Alt text] | 🔴 Critical | [Fix] |

#### Operable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | [Issue] | [2.1.1 Keyboard] | 🟡 Major | [Fix] |

#### Understandable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | [Issue] | [3.3.2 Labels] | 🟢 Minor | [Fix] |

#### Robust
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | [Issue] | [4.1.2 Name, Role, Value] | 🟡 Major | [Fix] |

### Keyboard Navigation
| Element | Tab Order | Enter/Space | Escape | Arrow Keys |
|---------|-----------|-------------|--------|------------|
| [Element] | [Order] | [Behavior] | [Behavior] | [Behavior] |

### Screen Reader
| Element | Announced As | Issue |
|---------|-------------|-------|
| [Element] | [What SR says] | [Problem if any] |

### Priority Fixes
1. **[Critical fix]** — Affects [who] and blocks [what]
2. **[Major fix]** — Improves [what] for [who]
3. **[Minor fix]** — Nice to have
```

## Team wiring (replaces the plugin's connector hooks)

The upstream skill branched on Figma / project-tracker MCP connectors. In this team those map to sources you already have:
- **Design source** → read the rendered page through `local-browser`, or the design itself; inspect font sizes and touch targets there.
- **Tracker** → file findings via `TRACKER.md` (user-level files under `~/.claude/kru/management/<project-slug>/`) when the lead asks for tickets; otherwise return the audit inline.

## Tips

1. **Start with keyboard and focus** — These catch the most common and impactful issues in scope here.
2. **Test with real assistive technology** — This audit is a great start, but manual testing with VoiceOver/NVDA catches things automation can't.
3. **Prioritize by impact** — Fix issues that block users first, polish later.
