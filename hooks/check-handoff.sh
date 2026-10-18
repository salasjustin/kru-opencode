#!/bin/bash
# pretooluse on the subagent-dispatch tool: the mechanized half of the lead
# contract's handoff scan (lead SKILL.md step 3). refuses a team-seat dispatch
# whose brief asserts a file:line coordinate, a verbatim run of an always-loaded
# rule, a paraphrase of the user AGENTS.md
# machine budget or the comment standard, a request for the return-pass line,
# or a hedged term — or a planner brief
# naming no brief.md, or a review brief naming no report path — and hands the
# reason back so the lead re-anchors and dispatches again, logging the refusal
# on the way out (see the refusal branch). the learnings channel
# is the one item it supplies rather than refuses over (see the tail). fail open on anything that isn't a clear hit — a gate that misfires
# costs more than one it lets through.
# a new scan lands in shadow: its hits go to the refusal log marked shadow and
# the dispatch goes through, until /kru/roster learn reads them clean across repos
# and moves the scan into reasons.
command -v jq >/dev/null 2>&1 || exit 0
plugin_root="${1:-}"
[ -d "$plugin_root/agent/kru" ] || exit 0
# unreadable only on a broken install, and every guard here fails open on those
. "$plugin_root/kru/scripts/kru-store.sh" 2>/dev/null || exit 0
[ -n "$KRU_NO_GATE" ] && exit 0
input=$(cat) || exit 0

seat=$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null)
seat="${seat#kru/}"
[ -z "$seat" ] && exit 0
# the auditor's brief is the stop nudge's own template, not a handoff
[ "$seat" = "dispatch-auditor" ] && exit 0
[ -f "$plugin_root/agent/kru/${seat}.md" ] || exit 0

prompt=$(printf '%s' "$input" | jq -r '.tool_input.prompt // empty' 2>/dev/null)
[ -z "$prompt" ] && exit 0

cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)
# the engagement stamp /kru/roster learn counts distinct repos with — the last path
# segment names whichever subdirectory the lead ran from, so one repo reads as
# several engagements and a team-wide preference grades as one client's.
cwd_slug=""
d="$cwd"
while [ -n "$d" ] && [ "$d" != "/" ] && [ "$d" != "." ]; do
  [ -e "$d/.git" ] && { cwd_slug=$(basename "$d"); break; }
  d=$(dirname "$d")
done
[ -z "$cwd_slug" ] && [ -n "$cwd" ] && cwd_slug=$(basename "$cwd")

reasons=""
# a coordinate is a stale cache: file.ext:NN, its approximate "file.ext ~:NN" /
# ":~NN" / "~L218", or a bare "line 91" / "lines 20-21". one inside quoted tool
# output — a fenced block or a "> " quote line, where a stack trace or a failing
# test's output lands — is evidence the brief observed rather than a location it asserts.
asserted=$(printf '%s\n' "$prompt" | awk '/^[[:space:]]*```/ { fence = !fence; next } !fence && !/^[[:space:]]*>/')
coords=$(printf '%s' "$asserted" | grep -oE '\.(tsx?|jsx?|mjs|cjs|svelte|vue|astro|md|go|py|rs|css|scss|json|sql|html|ya?ml|toml|sh)\b ?~?:~?[0-9]+|~L[0-9]+|\blines? [0-9]+' | head -5 | tr '\n' ' ')
[ -n "$coords" ] && reasons="coordinates instead of named anchors: ${coords}(re-anchor each to its function/const/section — item 2, scan 1). "
# the learnings channel is the same literal path on every brief, so the hook
# supplies it rather than refusing over its absence — a refusal costs a whole
# re-dispatch to re-type text this file already holds.
inject_channel=false
printf '%s' "$prompt" | grep -q 'inbox.md' || inject_channel=true
# a hedge on a term the builder codes against is a decision delegated by
# accident — scan 3's hedge half. a sentence that names what each answer does
# ("report which, fix that one", "handle both") is the investigation item 3
# asks for, not an open meaning. the imperative half stays a reading check.
hedge=$(printf '%s' "$prompt" | tr '\n' ' ' | tr '.' '\n' |
  grep -viE '\b(report|say|note) which\b|\bhandle (both|each|either)\b|\b(either way|whichever)\b|\bin (both|each|either) cases?\b' |
  grep -oiE '\b(may|might|could) mean\b|\bunclear (whether|if)\b|\bnot sure (whether|if)\b' | head -1)
[ -n "$hedge" ] && reasons="${reasons}hedged term: \"${hedge}\" — settle what it means, name what each answer does, or take the question to the user before dispatch (item 3, scan 3). "
# scan 3's imperative half stays a reading check — "decide" appears in briefs
# that resolve a decision too. its one mechanizable tell is the report-back:
# a brief asking which way the builder went is a brief admitting it delegated
# the call. one bounded span, no \b — the hook runs under whatever grep is on
# PATH, and two spans exceed ugrep's complexity limit.
# a sentence that names its fallback's trigger ("if X can't, do Y instead")
# resolved the call, and the report-back only says which branch fired. so does
# "what you chose/used" after a bound the seat measures against (the key that
# gives both, whatever test is practical) or a named fix it may depart from —
# only "what you decided" and "which way you went" hand a choice down.
opencall=$(printf '%s' "$prompt" | tr '\n' ' ' | tr '.' '\n' | grep -viE '(^| )if .* instead|depart from' | grep -oiE '(say|tell|report|note)[^.]{0,30}(which (way|one) you (went|chose|took|picked|decided|used)|what you decided)' | head -1)
[ -n "$opencall" ] && reasons="${reasons}open design call: \"${opencall}\" — resolve the decision, or make it an investigation naming what each answer resolves to (item 3, scan 3). "

# the two texts briefs re-type as paraphrase, which no shingle sees — lead scan 2
# names these greps.
# opencode loads its own global AGENTS.md and the user's ~/.claude/CLAUDE.md,
# so both are always-loaded canon a brief must point at rather than re-type
USER_CANON=""
for f in "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/AGENTS.md" "$HOME/.claude/CLAUDE.md"; do
  [ -f "$f" ] && USER_CANON="$USER_CANON $f"
done
if [ -n "$USER_CANON" ]; then
  # a brief naming some other limit — an R2 object cap, a container's memory
  # request, a machine that isn't this one — states a fact about the slice, so
  # the figure has to be one this file spends before it reads as re-typed, and
  # its sentence can't be about a deployed resource ("resize the Machine to 8 GB").
  DEPLOYED='\b(resize|scale|deploy(ed|s)?|provision(ed)?|instances?|vms?|containers?|pods?|fly|vercel|tier|region)\b'
  nfig() { tr '[:upper:]' '[:lower:]' | tr -d ' ' | sed 's/cores$/core/'; }
  figs=$(grep -hoiE '\b[0-9]+ ?(gb|cores?)\b' $USER_CANON | nfig | sort -u)
  budget=""
  # the reason quotes the brief's own spelling — the lead greps for the
  # sentence it names.
  if [ -n "$figs" ]; then
    while IFS= read -r raw; do
      [ -z "$raw" ] && continue
      printf '%s\n' "$figs" | grep -Fxq "$(printf '%s' "$raw" | nfig)" || continue
      budget="$raw"; break
    done < <(printf '%s' "$prompt" | tr '\n' ' ' | tr '.' '\n' | grep -viE "$DEPLOYED" | grep -oiE '\b[0-9]+ ?(gb|cores?)\b')
  fi
  # "one X at a time" is ordinary English — pacing tickets, rows, migrations,
  # a single writer. it's the machine budget only where a machine word sits in
  # the same sentence. the quote is the pacing clause, not the machine word —
  # that word is often the test command the slice legitimately names.
  [ -z "$budget" ] && budget=$(printf '%s' "$prompt" |
    grep -oiE '[^.]*\b(one|a single)( [a-z-]+){1,3} at a time\b[^.]*' |
    grep -iE '\b(ram|memory|swap|cores?|cpu|machine|budget|background shells?|long-running|headless|chromium|vitest|playwright|tsc)\b' |
    grep -oiE '\b(one|a single)( [a-z-]+){1,3} at a time\b' | head -1)
  [ -n "$budget" ] && reasons="${reasons}paraphrases the user rules file's machine budget: \"${budget}\" — that file loads into every seat on its own; cut that clause, keep any command the slice runs (scan 2). "
fi
# Block I rules on comments as a class; a brief naming one comment — "a
# lowercase doc comment on `ticker`", "the `SKIP_STATUSES` comment", "keep what
# its comment says true" — describes its own slice. both halves below match with
# context either side so that difference is visible; the reason quotes the
# narrow span. the rule's words are Block I's *Terse, in the file's own voice*:
# case and grammar follow the comments around the new one. a bare "case" is
# left out — "a comment on the empty case" is slice content, not the rule.
CVOICE='(lower ?case|upper ?case|capitali[sz]ed|sentence[- ]case|case and grammar|grammar and case|(own|file.s) voice|full sentences)'
CRULE="\\bcomments?\\b[^.]{0,80}\\b${CVOICE}|\\b${CVOICE}[^.]{0,80}\\bcomments?\\b"
# the standard's other half — comments already in the file survive your edit.
# reworded it escapes the shingle check, and it is the clause whose loss prunes
# the comment that carried the reason.
CKEEP='\b(preserve|keep|retain|never drop|do not drop|don.t drop)\b[^.]{0,60}\bcomments?\b|\bcomments?\b[^.]{0,60}\b(preserved|retained|survive|kept)\b'
cctx=$(printf '%s' "$prompt" | grep -oiE "[^.]{0,40}(${CRULE})[^.]{0,40}" | head -1)
[ -z "$cctx" ] && cctx=$(printf '%s' "$prompt" | grep -oE '[^.]+' |
  # "a comment about the email being kept" names what one comment says — the
  # verb belongs to its subject, not to the standard. markdown emphasis may
  # sit between the noun and its preposition.
  grep -viE '\bcomments?[*_]* (about|explaining|noting|saying|stating|describing|on|why|that|for)\b' |
  grep -oiE "[^.]{0,40}(${CKEEP})[^.]{0,40}" | head -1)
comments=""
if [ -n "$cctx" ]; then
  comments=$(printf '%s' "$cctx" | grep -oiE "${CRULE}|${CKEEP}" | head -1)
  # a backtick, a position or a possessive beside the noun points at one comment
  # in one file, and "a comment" is one the brief asks for. the class-wide
  # quantifiers are what the standard itself spends, so they hold the refusal
  # even where a nearby identifier is backticked —
  # "existing" only on the plural, since "its existing comment" names one.
  # a singular "the comment" or "a one-line comment" is one comment too, and
  # "keep its hand edits: lock_timeout, comments" lists one file's contents.
  if printf '%s' "$cctx" | grep -qiE '`|\b(above|below|beside)\b|\b(its|this|that|each|whose|a) comments?\b|\b(the|a|an)( [a-z-]+){0,2} comment\b|\bits\b[^.]{0,60}\bcomments?\b' &&
    ! printf '%s' "$cctx" | grep -qiE '\b(every|all|any) comments?\b|\bexisting comments\b'; then
    comments=""
  fi
fi
# the return-pass line is Block O's, already in every code-writing seat's prompt — a
# brief asking for it is a second source of that block (scan 2).
retpass=$(printf '%s' "$prompt" | grep -oiE 'return pass:?[^.]{0,40}' | head -1)
[ -n "$retpass" ] && reasons="${reasons}restates Block O: \"${retpass}\" — the seat prompt carries the return pass; cut the clause (scan 2). "
[ -n "$comments" ] && reasons="${reasons}paraphrases the comment standard: \"${comments}\" — Block I rides in the seat prompt; cut that clause, keep the rest of the sentence (scan 2). "

# a review seat writes its report where the brief says and returns a pointer —
# no path and the whole report lands in the lead's context (item 7, gates.md).
# the file is <seat>-<slice-slug>, the slug from the dispatch description, so two
# reviews by one seat in a session don't share a file.
# supplied, not refused, on the learnings channel's precedent: the path is
# derived from the seat and the description, and a refusal spends a whole re-dispatch
# to re-type text this file already holds.
inject_report=""
dslug=$(printf '%s' "$input" | jq -r '.tool_input.description // empty' 2>/dev/null |
  tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-' | sed 's/^-*//;s/-*$//' | cut -c1-40 | sed 's/-*$//')
case "$seat" in
  code-reviewer|architecture-reviewer|accessibility-reviewer|visual-reviewer|ux-auditor)
    printf '%s' "$prompt" | grep -q 'kru-review' ||
      inject_report="\n\nkru hook — report: \${TMPDIR:-/tmp}/kru-review/${cwd_slug:-repo}/${seat}${dslug:+-$dslug}.md. Write the long half of your return there; hand back the capped fix list plus that path (item 7, gates.md)." ;;
esac

# an always-loaded rule restated in the brief is a second source that drifts —
# scan 2 says point at the file instead. the mechanizable half is the verbatim
# one: a run of SHINGLE words from the brief found unchanged in a canonical
# text. paraphrase stays a reading check; a shorter run would misfire on
# ordinary phrasing, so the length is the fail-open margin. rule files are
# terse, so the run shortens with them: six words from the repo's own
# AGENTS.md or rules, five from the user's, where the machine budget is the
# text briefs re-type most.
SHINGLE=8
SHINGLE_REPO=6
SHINGLE_USER=5
canon=""
repo_canon=""
for f in "$cwd/AGENTS.md" "$cwd/.opencode/AGENTS.md" "$cwd"/.claude/rules/*.md; do
  [ -f "$f" ] && canon="$canon $f" && repo_canon="$repo_canon $f"
done
for f in $USER_CANON "$plugin_root/skill/kru-roster/shared-blocks.md"; do
  [ -f "$f" ] && canon="$canon $f"
done
# the plan store's contract is the file a planner brief re-types (lead step 2.6)
[ "$seat" = "planner" ] && [ -f "$plugin_root/kru/TRACKER.md" ] && canon="$canon $plugin_root/kru/TRACKER.md"
# a path and a backticked identifier are the pointer scan 2 asks for in place
# of the text, and stripping punctuation turns one of them into a six-word run
# any repo's own path map already spends — the gate refusing its own remedy.
# barrier each with a word no canon holds, so a pointer neither matches on its
# own nor joins the prose on either side of it.
BARRIER=' zzpointerzz '
point() { sed -E -e "s/\`[^\`]*\`/${BARRIER}/g" \
  -e "s#[A-Za-z0-9_@~.-]*/[A-Za-z0-9_@~./-]*#${BARRIER}#g" \
  -e "s/[A-Za-z0-9_-]+\.(tsx?|jsx?|mjs|cjs|svelte|vue|astro|md|go|py|rs|css|scss|json|sql|html|ya?ml|toml|sh)/${BARRIER}/g"; }
norm() { tr '[:upper:]' '[:lower:]' | tr -c '[:alnum:]\n' ' ' | tr -s ' \n' ' '; }
shingle() { # files → "file<TAB>run" of the first verbatim hit
  printf '%s' "$prompt" | point | norm | awk -v n="$SHINGLE" -v nr="$SHINGLE_REPO" -v ns="$SHINGLE_USER" -v short="$USER_CANON " -v repo=" $repo_canon " -v files="$1" '
    BEGIN {
      split(files, fs, " ")
      for (i in fs) { f = fs[i]; if (f == "") continue
        text = ""
        while ((getline line < f) > 0) text = text " " tolower(line)
        close(f)
        gsub(/[^[:alnum:]]+/, " ", text)
        corpus[f] = text }
    }
    { for (f in corpus) { m = index(short, " " f " ") ? ns : (index(repo, " " f " ") ? nr : n)
        for (i = 1; i + m - 1 <= NF; i++) {
          s = $i; for (j = 1; j < m; j++) s = s " " $(i + j)
          if (index(corpus[f], " " s " ")) { print f "\t" s; exit } } } }'
}
if [ -n "$canon" ]; then
  hit=$(shingle "$canon")
  [ -n "$hit" ] && reasons="${reasons}restates a file verbatim: \"${hit#*	}\" is in ${hit%%	*} — point at the file instead (scan 2). "
fi

# planner reads a written brief.md (lead step 2.6)
if [ "$seat" = "planner" ] && ! printf '%s' "$prompt" | grep -q 'brief\.md'; then
  reasons="${reasons}planner brief names no brief.md: run /kru/brief first and point the seat at the written file (step 2.6). "
fi

# shadow scans — logged, never refused.
shadow=""
# grouping: a sheet line names the directories its seat owns in backticks, so a
# file under another seat's directory rides in the wrong brief. only a seat the
# sheet gives directories to is checked, and only a seat that edits — a
# read-only seat's brief (a reviewer, an auditor) names every lane it reads.
# a sheet line names skills as kru:<skill> too, and a skill owns no directory,
# so an owner counts only when it is a seat.
lanes=""
for f in "$cwd/AGENTS.md"; do
  [ -f "$f" ] && lanes="$lanes$(grep -E 'kru/[a-z-]+' "$f" | awk '{
    if (!match($0, /kru/[a-z-]+/)) next
    owner = substr($0, RSTART + 4, RLENGTH - 4); rest = $0
    while (match(rest, /`[^` ]+\/[^` ]*`/)) {
      d = substr(rest, RSTART + 1, RLENGTH - 2); sub(/\/+$/, "", d)
      if (d !~ /^@/) print d, owner; rest = substr(rest, RSTART + RLENGTH)
    }
  }' | while read -r d o; do [ -f "$plugin_root/agent/kru/$o.md" ] && printf '%s %s\n' "$d" "$o"; done)
"
done
readonly_seat=false
grep -q '^  "\*": deny' "$plugin_root/agent/kru/$seat.md" && ! grep -q '^  edit: allow' "$plugin_root/agent/kru/$seat.md" && readonly_seat=true
if [ -n "$lanes" ] && ! $readonly_seat && printf '%s' "$lanes" | awk -v s="$seat" '$2 == s { f = 1 } END { exit !f }'; then
  # a scoped package (`@libsql/client`) is a dependency, not a directory; a
  # sentence handing a path to its owner ("the auth seat owns that file") names
  # it for reading.
  misroute=$(printf '%s\n' "$prompt" | sed 's/\. /\
/g' | grep -viE "\banother (seat|lane)|\bseat owns\b|\bowns (that|this|the) file\b|\boutside (the|your|its) lane\b" |
    grep -oE '(^|[^@A-Za-z0-9_.-])[A-Za-z0-9_.-]+(/[][A-Za-z0-9_.@()-]+)+' | sed -E 's#^[^A-Za-z0-9_.-]##' | sort -u | head -40 |
    awk -v s="$seat" 'NR == FNR { if (NF == 2) { dir[++n] = $1; own[n] = $2 }; next }
      { best = ""; bl = 0
        for (i = 1; i <= n; i++) if (($0 == dir[i] || index($0, dir[i] "/") == 1) && length(dir[i]) > bl) { best = own[i]; bl = length(dir[i]) }
        if (best != "" && best != s) { print $0 " is " best "'"'"'s"; exit } }' <(printf '%s' "$lanes") -)
  [ -n "$misroute" ] && shadow="${shadow}grouping: ${misroute} per the sheet — split it into that seat's brief (step 3). "
fi

# the cross-session log /kru/roster learn sweeps for misfires, reading each quoted
# span against the sentence around it — so the log stores those windows, and
# the prompt head, most of its bytes, stays in the session ledger where
# dispatch-auditor grades the brief's own text.
log_refusal() { # record, reasons text
  local spans rrecord rlog
  spans=$(printf '%s' "$2" | grep -oE '"[^"]{4,120}"' | sed 's/^"//;s/"$//' |
    while IFS= read -r q; do
      [ -z "$q" ] && continue
      printf '%s' "$prompt" | awk -v q="$q" '{ i = index($0, q); if (i) { s = i - 160; if (s < 1) s = 1
        print substr($0, s, length(q) + 280) } }'
    done | awk '!seen[$0]++' | head -5)
  rrecord=$(printf '%s' "$1" |
    jq -c --arg spans "$spans" 'del(.prompt, .truncated) + { spans: ($spans | split("\n") | map(select(length > 0))) }' 2>/dev/null)
  # the sweep drains what it reads; the cap bounds a log nobody sweeps
  rlog="$(kru_path refusals)"
  mkdir -p "$(dirname "$rlog")" 2>/dev/null
  printf '%s\n' "${rrecord:-$1}" >> "$rlog" 2>/dev/null
  if [ "$(wc -l < "$rlog" 2>/dev/null | tr -d ' ')" -gt 500 ] 2>/dev/null; then
    tail -n 500 "$rlog" > "$rlog.tmp" 2>/dev/null && mv "$rlog.tmp" "$rlog" 2>/dev/null
  fi
}

sid=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null)
# refused: true | false, reasons text
make_record() {
  printf '%s' "$input" | jq -c --arg seat "$seat" --arg reasons "$2" --arg sid "$sid" --arg slug "$cwd_slug" --argjson refused "$1" '{
    ts: (now | todate),
    session: $sid,
    cwd: $slug,
    seat: $seat,
    desc: (.tool_input.description // ""),
    prompt: ((.tool_input.prompt // "")[0:32000]),
    truncated: (((.tool_input.prompt // "") | length) > 32000),
    refused: $refused,
    reasons: $reasons
  } + (if $refused then {} else { shadow: true } end)' 2>/dev/null
}

if [ -n "$reasons" ]; then
  # a refused dispatch never reaches the posttooluse ledger writer, so this
  # branch writes the catch twice: to the session ledger, where dispatch-auditor
  # sees a scan the lead keeps walking past, and to a cross-session log
  # /kru/roster learn sweeps for misfires. log-dispatch.sh's record plus session and
  # reasons; a logging miss still refuses.
  record=$(make_record true "$reasons")
  adir=$(kru_path audit)
  if [ -n "$record" ] && mkdir -p "$adir" 2>/dev/null; then
    [ -n "$sid" ] && printf '%s\n' "$record" >> "$adir/$sid.jsonl" 2>/dev/null
    log_refusal "$record" "$reasons"
  fi
  printf 'kru handoff gate refused the dispatch to %s — %sFix the brief and dispatch again.\n' "$seat" "$reasons" >&2
  exit 2
fi

if [ -n "$shadow" ]; then
  record=$(make_record false "$shadow")
  [ -n "$record" ] && log_refusal "$record" "$shadow"
fi

# nothing to refuse. updatedInput replaces the whole tool_input, so it is built
# from the original rather than assembled — and any jq failure falls through to
# a plain allow, the same fail-open the rest of this gate keeps. the injected
# text names itself so the auditor reading the stored prompt can tell the hook's
# paragraph from the lead's own.
add=""
[ "$inject_channel" = true ] && add="\n\nkru hook — learnings channel: a durable, cross-project preference you hit mid-task (the user rejected X twice and chose Y), or what moving a library to a new major broke or needed (naming its kru skill), goes as one line to $(kru_path inbox), format at $plugin_root/kru/PREFERENCES.md. Journaling, not derailing."
add="${add}${inject_report}"
[ -z "$add" ] && exit 0
printf '%s' "$input" | jq -c --arg add "$add" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    updatedInput: (.tool_input | .prompt += ($add | gsub("\\\\n"; "\n")))
  }
}' 2>/dev/null
exit 0
