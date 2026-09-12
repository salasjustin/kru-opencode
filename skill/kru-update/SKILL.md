---
name: kru-update
description: Sweep what moved under the team since it last looked — Claude Code releases, the upstream of vendored skills, the packages first-party skills were reproduced on — and record a verdict per change. Also settles whether a capability you heard about is reachable on this install.
disable-model-invocation: true
argument-hint: "[claude [version] | vendored [skill] | libs [skill]] — omit for all three"
---

Three grounds move under this plugin, each on its own schedule:

| Ground | What moves | Where the team's copy is pinned | Sweep |
|---|---|---|---|
| **Claude Code** | a frontmatter key that makes a seat cheaper, a dispatch semantic the `lead` routes on, a built-in it delegates to | `reviewed.md` → *Claude Code* → *Swept through* | `claude.md` |
| **Vendored skills** | the upstream file a `skills/<name>/` was copied verbatim from | the provenance comment at the top of its `SKILL.md` (repo · ref · sha), else its `SOURCES.md` → *Vendored resources* row | `vendored.md` |
| **Libraries** | the package a first-party skill's claims were reproduced on — a minor that renames a `future` export, a major that moves the whole premise | the *Reproduced on `pkg@x.y.z`* line beneath the skill's frontmatter, or its *As of `<date>`* dist-tag claim | `libs.md` |

Each sweep reads what shipped, keeps only what touches a surface the team stands on, and records a verdict so the next sweep starts where this one stopped.

**Verdicts, not edits.** A sweep is reads — the binary, a diff, a registry, release notes — and it writes one file: `reviewed.md`, beside it. Everything it surfaces lands through `/roster`: a Claude Code adoption is a wiring change (`skills/roster/SKILL.md` → *Wiring map*); a vendored re-sync or a library re-verification is `/roster author <name>` → *Refresh*, the session that downloads, installs and reproduces. A `Reproduced on` pin and a provenance sha move only there.

**The thing on disk is the authority; the announcement is the lead.** A changelog entry can be gated off this install, an upstream commit can touch only files the copy excludes, a release note can name an API the skill never claims. Every candidate is confirmed against the binary, the diff, or the skill's own lines before it reaches a verdict.

## Dispatch

Read the file for the requested sweep, then run it.

| `$ARGUMENTS` | Do | File |
|---|---|---|
| _(none)_ | all three, in table order, one report | — |
| `claude [version]` | the Claude Code releases above the mark (or back to `version`) | `claude.md` |
| `vendored [skill]` | upstream of every vendored skill (or the one named) | `vendored.md` |
| `libs [skill]` | the packages every first-party library skill is reproduced on (or the one named) | `libs.md` |

A bare version number (`2.1.240`) is `claude 2.1.240`.

## The verdicts

Each sweep file names its own **action** verdict (*Adopt* · *Re-sync* · *Re-verify*) and the cases that fall short of it; these three are shared, and every verdict names the file it lands in:

- **Consider** — real value at a cost the user decides: money, a machine constraint the user's `~/.claude/CLAUDE.md` sets, a UX change to a skill they type, a reproduction session.
- **Decline** — with the one-line reason, so the next sweep doesn't re-litigate it.
- **Current** — nothing moved that the copy carries; the mark advances.

## The ledger — `reviewed.md`

One section per ground, each with its own mark and its standing verdicts. A sweep rewrites its own section and leaves the other two as they are. A standing verdict holds until the surface it judged changes again — a declined key re-earns a read only when a later release changes it, a declined upstream hunk only when a later commit touches the same lines.

