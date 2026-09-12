/// <reference types="@opencode-ai/plugin" />
// the mechanized half of the lead contract, as an opencode plugin. three of the
// four gates are upstream's shell scripts run through an adapter — the logic
// stays where upstream edits it, and this file only translates opencode's hook
// shape into the claude-shaped json those scripts read on stdin.
//
// the fourth (the lead gate) has no script left to call: upstream's reads the
// session transcript, which opencode does not expose to a hook, so the session
// state it inferred is tracked here instead. that makes it the one piece that
// has to be hand-mirrored when upstream changes require-lead.sh (PORTING.md).

import type { Plugin } from "@opencode-ai/plugin"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"

// <config>/plugin/kru.ts → <config>, which is what the ported prompts spell as
// {KRU_HOME} and what the shell hooks take as their plugin root
const KRU_HOME = dirname(dirname(fileURLToPath(import.meta.url)))
const HOOKS = join(KRU_HOME, "kru", "hooks")
// the state store is shared with the claude-code fork on purpose: a plan,
// ticket queue or learnings inbox started in one harness continues in the other
const STORE = join(homedir(), ".claude", "kru")
const LEDGER_DIR = join(STORE, "audit")

const LEAD_MARKER = "You are the engineering lead."
const GATE_MESSAGE =
  "kru: this session has not loaded the lead contract. Switch to the `kru` agent (tab) or load the `kru-lead` skill, then take the action again — nothing else about the request has changed. This fires once per session, and read-only commands are exempt. To run without it: touch ~/.claude/kru/lead-gate/off"

// bash edits as readily as edit does — a redirect, a substitution, an in-place
// flag — so bash is gated too, but a command that only reads is an inspection
// and a triage turn should not pay the contract's price to run `cat`. mirrors
// hooks/require-lead.sh upstream; every verb has to read, or the gate stands.
const READ_VERBS = new Set([
  "ls", "cat", "head", "tail", "wc", "grep", "egrep", "fgrep", "rg", "find", "file", "stat",
  "pwd", "realpath", "basename", "dirname", "which", "command", "type", "echo", "printf",
  "jq", "yq", "sort", "uniq", "cut", "tr", "column", "date", "test", "true", "env", "diff",
  // safe only because the write-tells below already took sed -i and any redirect
  "sed", "awk", "nl", "tac", "comm", "xxd", "base64",
])
const WRITE_TELLS = [">", "$(", "`", "sed -i", "perl -i", "--in-place", "-exec", "xargs"]
const READ_SUBCOMMANDS = [
  "git status", "git log", "git diff", "git show", "git branch", "git remote -v",
  "opencode auth list", "opencode agent list",
]

function readOnlyBash(command: string): boolean {
  if (!command) return false
  if (WRITE_TELLS.some((t) => command.includes(t))) return false
  const verbs = command
    .split(/[|;&]/)
    .map((part) => part.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean)
    .map((v) => v.split("/").pop() as string)
  if (verbs.length && verbs.every((v) => READ_VERBS.has(v))) return true
  return READ_SUBCOMMANDS.some((c) => command.startsWith(c))
}

// the scripts expect claude's hook payload on stdin and answer the way claude's
// protocol answers: exit 2 with a reason on stderr is a refusal, stdout is
// context to hand back.
function runHook(script: string, payload: unknown): { blocked?: string; context?: string } {
  const path = join(HOOKS, script)
  if (!existsSync(path)) return {}
  try {
    const stdout = execFileSync("bash", [path, KRU_HOME], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    })
    return { context: stdout.trim() || undefined }
  } catch (err: any) {
    if (err?.status === 2) return { blocked: String(err.stderr ?? "").trim() || "kru: refused" }
    return {} // fail open: a gate that misfires costs more than one that lets through
  }
}

const ledgerPath = (sessionID: string) => join(LEDGER_DIR, `${sessionID}.jsonl`)

function ledgerCount(sessionID: string): number {
  const path = ledgerPath(sessionID)
  if (!existsSync(path)) return 0
  try {
    return readFileSync(path, "utf8").split("\n").filter(Boolean).length
  } catch {
    return 0
  }
}

export const kru: Plugin = async ({ client, directory }) => {
  // session state, not durable: a session either carries the contract or it does
  // not, and the answer dies with the session
  const lead = new Set<string>()
  const gated = new Set<string>()

  const markLead = (sessionID?: string) => sessionID && lead.add(sessionID)

  return {
    // the kru primary agent carries the contract as its system prompt; anything
    // else has to load the skill. this is also where the audit nudge lands,
    // since opencode has no blocking stop hook to refuse the turn's end.
    "experimental.chat.system.transform": async (input, output) => {
      const joined = output.system.join("\n")
      if (joined.includes(LEAD_MARKER)) markLead(input.sessionID)
      if (!input.sessionID) return
      const n = ledgerCount(input.sessionID)
      if (!n || process.env.KRU_NO_AUDIT) return
      output.system.push(
        [
          `kru dispatch audit pending: ${n} team-seat dispatch(es) this session, logged at ${ledgerPath(input.sessionID)}.`,
          `Before you end this turn, dispatch the \`kru/dispatch-auditor\` subagent exactly once with the prompt:`,
          `"Audit the dispatch ledger at ${ledgerPath(input.sessionID)}. Lead contract (for exact wording only): ${join(KRU_HOME, "agent", "kru.md")}, Step 3."`,
          `The seat carries its own rulebook; it files durable orchestration learnings to the preference inbox and deletes the ledger. Relay its one-line return, then stop.`,
        ].join(" "),
      )
    },

    "tool.execute.before": async (input, output) => {
      const args = (output.args ?? {}) as Record<string, any>

      // the load itself is a skill call — gating it would close the only door out
      if (input.tool === "skill") {
        if (typeof args.name === "string" && args.name === "kru-lead") markLead(input.sessionID)
        return
      }

      if (input.tool === "task") {
        const seat = String(args.subagent_type ?? "")
        if (seat.startsWith("kru/")) {
          const { blocked } = runHook("check-handoff.sh", {
            tool_name: "Task",
            tool_input: { subagent_type: seat, prompt: args.prompt ?? "", description: args.description ?? "" },
            cwd: directory,
          })
          if (blocked) throw new Error(blocked)
        }
      }

      // --- the lead gate -----------------------------------------------------
      if (process.env.KRU_NO_LEAD_GATE) return
      if (existsSync(join(STORE, "lead-gate", "off"))) return
      if (!input.sessionID || lead.has(input.sessionID)) return
      if (["todowrite", "question", "read", "grep", "glob", "list", "webfetch", "websearch"].includes(input.tool)) return
      if (input.tool === "bash" && readOnlyBash(String(args.command ?? ""))) return
      if (gated.has(input.sessionID)) return // fires once per session

      gated.add(input.sessionID)
      throw new Error(GATE_MESSAGE)
    },

    "tool.execute.after": async (input, output) => {
      if (input.tool !== "task") return
      const args = (input.args ?? {}) as Record<string, any>
      const seat = String(args.subagent_type ?? "")
      if (!seat.startsWith("kru/")) return
      try {
        mkdirSync(LEDGER_DIR, { recursive: true })
      } catch {}
      const { context } = runHook("log-dispatch.sh", {
        tool_name: "Task",
        tool_input: { subagent_type: seat, prompt: args.prompt ?? "", description: args.description ?? "" },
        tool_response: output.output ?? "",
        session_id: input.sessionID,
        cwd: directory,
      })
      // the lead reads a return and routes on it in the same breath, so an
      // unstated return pass has to arrive with the return, not at turn end
      if (context) output.output = `${output.output ?? ""}\n\n${context}`
    },

    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      const sessionID = (event as any).properties?.sessionID
      if (!sessionID) return
      const n = ledgerCount(sessionID)
      if (!n) return
      await client.app
        .log({ body: { service: "kru", level: "info", message: `dispatch audit pending: ${n} dispatch(es)` } })
        .catch(() => {})
    },
  }
}
