#!/bin/bash
# posttooluse on the subagent-dispatch tool: append one jsonl line per team-seat
# dispatch to the session ledger dispatch-auditor reads. fail open everywhere —
# a logging miss must never break the session.
command -v jq >/dev/null 2>&1 || exit 0
# plugin root arrives as $1 (substituted in hooks.json) — it is not a
# guaranteed env var here, and an empty root would silence logging forever
plugin_root="${1:-$KRU_HOME}"
[ -d "$plugin_root/agent/kru" ] || exit 0
input=$(cat) || exit 0

seat=$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null)
seat="${seat#kru/}"
[ -z "$seat" ] && exit 0
# the auditor's own dispatch would re-create the ledger it just deleted
[ "$seat" = "dispatch-auditor" ] && exit 0
# only team seats are auditable against the lead contract
[ -f "$plugin_root/agent/kru/${seat}.md" ] || exit 0

# seats carrying Block O owe a `Return pass:` line; the flag tells the auditor
# whether an absent line is a deviation or simply a seat the block never bound
block_o=false
grep -q '^## The return pass' "$plugin_root/agent/kru/${seat}.md" 2>/dev/null && block_o=true

# computed here rather than inside the jq below: the lead is told about this
# pair too, and a turn-end audit lands long after the return was routed on
return_pass=false
printf '%s' "$input" |
  jq -r '(.tool_response // "" | if type == "string" then . else tojson end)' 2>/dev/null |
  grep -q 'Return pass:' && return_pass=true

sid=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null)
[ -z "$sid" ] && exit 0

dir="$HOME/.claude/kru/audit"
mkdir -p "$dir" 2>/dev/null || exit 0
# crashed sessions leave ledgers nothing will audit, and the stop nudge's mark
# beside each one; keep the dir bounded
find "$dir" \( -name '*.jsonl' -o -name '*.jsonl.nudged' \) -mtime +7 -delete 2>/dev/null

# prompt head capped at 4000 chars — enough for a brief's handoff items;
# `truncated` tells the auditor an absent clause past the cut is not evidence.
# the response itself is never stored — only whether it carried the return-pass
# line — so the ledger stays a record of the lead's process, not of seat output
printf '%s' "$input" | jq -c --arg seat "$seat" \
  --argjson block_o "$block_o" --argjson return_pass "$return_pass" '{
  ts: (now | todate),
  cwd: ((.cwd // "") | split("/") | last),
  seat: $seat,
  desc: (.tool_input.description // ""),
  prompt: ((.tool_input.prompt // "")[0:4000]),
  truncated: (((.tool_input.prompt // "") | length) > 4000),
  block_o: $block_o,
  return_pass: $return_pass
}' >> "$dir/$sid.jsonl" 2>/dev/null

# the lead reads a return and routes on it in the same breath, and this pair is
# the one deviation nothing surfaces until the turn ends — by which time the
# slice is through its gates. posttooluse cannot block a dispatch that already
# finished (exit 2 is not honoured here); additionalContext is the whole lever,
# and putting the fact in front of the lead in time is the whole job.
if [ "$block_o" = true ] && [ "$return_pass" = false ]; then
  printf 'kru: %s carries Block O and its return states no `Return pass:` line — the pass either did not run or went unstated, so the slice arrives unread as a whole. Ask that seat for it (same task_id) before routing on this return.\n' "$seat"
fi

exit 0
