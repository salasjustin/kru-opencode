# Terminal output

## A span the operator will retype is drawn as code

**Trigger:** anything the program prints for a person to read — a status line, an error, a next-step hint, a run summary.
**Pattern:** mark as one class the spans the operator would retype, paste or search for — this binary's own commands and flags, filesystem paths, filenames, URLs and addresses, env-var names. A value the tool is merely reporting back (a version, a commit, an account, worker or database name) is prose, like the sentence around it.
**Default it corrects:** one undifferentiated stream where the path in the sentence looks like the words beside it — or the inverse, every proper noun marked, so the app's own name is as loud as the one command the reader came for.
**Why:** the operator's next move is to copy something out of this line, and the marking is the only thing that says which span that is. Marked everywhere it carries no information and costs a read of the whole sentence to find the actionable token; marked nowhere, a path containing a space is indistinguishable from the sentence it sits in, which is how it gets copied short. The cut is retypeable-versus-reported, not important-versus-unimportant — a version number matters and is still nothing to type.
**Applies when:** a person is watching the stream. Piped or `--json` output carries no marking at all, and the check for whether anyone is watching is the same one that decides colour.

A nested run's progress tree follows the web rule — the busy indicator sits on the innermost running node (`reference/forms-and-mutations.md`).
