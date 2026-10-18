# The sync lane — designing out of the repo's real components

For the **designer** maintaining a React design bundle — not the engineering lead. Read when the tree has a `.design-sync/`, or before standing one up. Engineering builds components; the designer publishes and designs against the bundle (`references/designer-handoff.md`).

`/design-sync` publishes a bundle of the repo's **real** components to a claude.ai/design project. Everything it buys is paid for in maintenance.

## The entry bar

Stand up a bundle where **someone who doesn't write code designs against the system** on a recurring basis. That recurring designer turn pays for the lane.

Two conditions gate it:

- **React.** The converter takes React components.
- **A maintained build.** A bundle is a workspace package with a preview harness, export surface, stylesheet build and notes file.

Where every design turn reads the tree fresh in `/design`, there is nothing to push and nothing to go stale.

## The loop

Two steps wrap steady-state design → PM handoff → engineering land:

- **Push, first.** Build from the tree and sync. Stylesheet is the repo's compiled CSS; component list is the repo's; prose is the conventions file in **header** era.
- **Rebuild and resync, last.** After engineering lands component or token changes, refresh the bundle so the next design session sees real parts.

The repo is upstream: a deleted component comes off the remote on the next resync.

## The bundle — what the designer actually gets

- **Stylesheet is the app's prebuilt CSS, not the token file.** Under JIT, missing utilities fail silently — state this in the header.
- **Artifact is content-hashed and goes stale** after app builds — refresh `cfg.cssEntry` per repo procedure.
- **Prop contracts** from `.d.ts` or regenerated from source — empty props force guesswork.
- **Export surface** is explicit, one named export per published component.

## The notes file

`.design-sync/NOTES.md` accumulates repo-specific truth: converter workarounds, overlay capture, fixed clock in harness. Written as discovered; the designer owns it, with UI builders fixing the underlying components when needed.
