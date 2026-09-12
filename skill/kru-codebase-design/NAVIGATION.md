<!-- repo-owned, not vendored: the navigation branch of `codebase-design`, sourced from in-repo measurement (read amplification over a 1,509-file TypeScript monorepo) rather than upstream. Survives a re-sync of SKILL.md unchanged; SKILL.md's pointer to it under *Going deeper* is the one deviation in that file's vendoring note. -->

# Navigation

The retrieval branch of [`codebase-design`](SKILL.md): whether the agent reaches an interface at all. `SKILL.md` decides what sits behind one. Assumes its vocabulary — **interface**, **seam**, **depth**.

## Amplification

A file's **closure** is the set of files reachable from it in N hops of local imports. **Amplification** is that closure's weight over the file's own tokens — what you must read to understand one file.

Depth shortens the closure by putting more behind each interface. Navigation is the other half: landing in the right closure, and keeping a change inside one.

## The name is the entry

An agent's first move in unfamiliar code is a keyword search, so a symbol's name is its index entry. A name drawn from the **mechanism** — `useDebouncedSyncQueue` — is reachable only from code that already imports it. A name drawn from the **job** — `saveDraft` — is reachable from the word the task arrived in.

The bar is checkable: **the word in the request appears in the code.** A feature the user calls a refund, implemented as `reverseCharge`, costs every later search for *refund* a miss and a wrong file — and the miss is silent, because a search that returns nothing reads exactly like a feature that was never built.

One concept keeps one name repo-wide; choosing and recording it is `domain-modeling`'s discipline, not this file's.

## Topology sets the closure

Directory shape decides which files a change's closure contains, because imports follow it.

- **By feature** — the closure is the directory. Listing one folder is reading the change.
- **By kind** (`components/`, `hooks/`, `utils/`, `types/`) — the closure crosses every folder by construction. One feature's change becomes N walks, and interface depth cannot remove them, because the split runs orthogonal to the seam.

A change to one feature landing in one directory is the target. Where it doesn't, the seam is misplaced — the same object `SKILL.md` names, read off the filesystem instead of the type signature.

**The repo that already has a shape wins.** This is a bar for a directory you are creating and for a seam you are already moving; against an existing tree, the finding is scoped to what the change touches. A by-kind repo is the convention this change follows.
