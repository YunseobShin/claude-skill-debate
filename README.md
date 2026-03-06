<p align="center">
  <br/>
  ⚔ ─────────── ⚔
  <br/><br/>
  <img src="assets/debate-flow.png" width="600" alt="Debate Flow">
  <br/><br/>
  <strong>C L A U D E - S K I L L - D E B A T E</strong>
  <br/><br/>
  ⚔ ─────────── ⚔
  <br/>
</p>

<p align="center">
  <strong>Two AIs enter. One verdict leaves.</strong>
  <br/>
  <sub>A Claude Code skill that makes Claude and GPT debate any topic, cross fact-check each other, and produce an HTML verdict report.</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claude-skill-debate"><img src="https://img.shields.io/npm/v/claude-skill-debate?color=blue" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://github.com/YunseobShin/claude-skill-debate"><img src="https://img.shields.io/github/stars/YunseobShin/claude-skill-debate?style=social" alt="Stars"></a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#why">Why</a> ·
  <a href="#the-arena">The Arena</a> ·
  <a href="#output">Output</a> ·
  <a href="#prerequisites">Prerequisites</a>
</p>

---

> *The best way to stress-test an idea is to have two smart opponents try to destroy each other's arguments, then let a judge decide.*

Most AI analysis gives you **one perspective**. You nod along, never knowing what it missed. Debate forces both sides to attack, defend, and cite evidence, while a neutral reporter picks the winner.

No false balance. No "both sides have a point." **Someone wins.**

---

## Why

```
Single AI analysis:
  "Here's my take" → You accept it → Confirmation bias

Debate:
  Claude: "Here's why I'm right"
  GPT:    "Here's why you're wrong"
  Claude: "Your data is cherry-picked, here's the full picture"
  GPT:    "Your model assumes 20% CAGR, Microsoft only did 12%"
  Judge:  "GPT wins 29.5 to 27.5. Here's why."
```

Two adversarial AIs will find flaws that a single AI never surfaces. The cross fact-check phase catches bad numbers, misleading citations, and logical gaps.

---

## Install

```bash
npx claude-skill-debate
```

That's it. One command. The skill is copied to `~/.claude/skills/debate/` and ready to use.

<details>
<summary><strong>Manual install</strong></summary>

```bash
git clone https://github.com/YunseobShin/claude-skill-debate.git
mkdir -p ~/.claude/skills/debate
cp claude-skill-debate/SKILL.md ~/.claude/skills/debate/SKILL.md
```

</details>

---

## Usage

Inside a Claude Code session:

```
/debate Will AI replace software engineers?
/debate React vs Vue for new projects in 2026
/debate Tesla stock price outlook
/debate Should central banks adopt CBDCs?
```

Natural language also triggers it:

```
"Have two AIs debate this"
"Make Claude and GPT argue about this"
```

---

## The Arena

Five phases. Two combatants. One judge.

```
Phase 0   PREPARATION
          Topic → 3-5 key arguments → debate rules
          ──────────────────────────────────────────

Phase 1   INDEPENDENT ANALYSIS  (parallel)
          Claude ──┐
                   ├──→  500-800 word analysis each
          GPT   ───┘
          ──────────────────────────────────────────

Phase 2   FREE DEBATE  (up to 5 rounds)
          Round 1:  Claude attacks  →  GPT counters
          Round 2:  GPT attacks     →  Claude counters
          ...
          Convergence check: no new arguments → early exit
          ──────────────────────────────────────────

Phase 3   CROSS FACT-CHECK
          Claude → verifies GPT's top 3 claims
          GPT    → verifies Claude's top 3 claims
          Verdict: [Confirmed / Refuted / Unverified]
          ──────────────────────────────────────────

Phase 4   VERDICT REPORT
          Neutral Reporter agent reads full transcript
          → HTML report (Tailwind CSS, dark mode)
          → Clear winner, not "both have merits"
```

### Why Cross Fact-Check Matters

In our first real debate (Palantir stock outlook), fact-checking caught:
- Claude citing **Q4 revenue growth as +70%** (actual: +36%, it mixed up adjusted vs GAAP)
- GPT citing **commercial revenue growth as +109%** (actual: +60% global, +109% was US-only)

Both sides had compelling arguments. But one side had more wrong numbers. **The fact-check changed the verdict.**

---

## Output

All artifacts saved to `/tmp/debate/YYYYMMDD_HHMMSS/`:

| File | What |
|:-----|:-----|
| `topic.md` | Topic & key arguments |
| `rules.md` | Debate rules |
| `analysis_claude.md` | Claude's independent analysis |
| `analysis_codex.md` | GPT's independent analysis |
| `round_N_claude.md` | Claude's round N statement |
| `round_N_codex.md` | GPT's round N statement |
| `factcheck_by_claude.md` | Claude fact-checks GPT |
| `factcheck_by_codex.md` | GPT fact-checks Claude |
| **`report.html`** | **Final HTML verdict report** |

### The Report

The HTML report has 8 sections:

1. **Header** with topic, date, participants
2. **Background** (200 words max)
3. **Key issues** in card layout
4. **Debate highlights** with per-round quotes
5. **Fact-check results table** (claim / verdict / evidence)
6. **Final verdict** with clear winner and scoring
7. **Conclusion & takeaways**
8. **Disclaimer**

The report auto-opens in your browser on completion.

---

## Prerequisites

| Requirement | Required | Notes |
|:---|:---:|:---|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Yes | CLI installed and authenticated |
| [OpenAI Codex CLI](https://github.com/openai/codex) | Yes | `npm i -g @openai/codex` |
| Codex MCP Server | No | Enables multi-turn threading (recommended) |

### Codex Setup

```bash
# Install
npm install -g @openai/codex

# Authenticate (ChatGPT Plus or Pro Plan)
codex auth login
```

<details>
<summary><strong>Optional: Codex MCP Server for richer debates</strong></summary>

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "codex": {
      "command": "codex",
      "args": ["--full-auto", "mcp"]
    }
  }
}
```

Without MCP, the skill falls back to CLI mode automatically.

</details>

---

## Design Principles

| Principle | Implementation |
|:----------|:--------------|
| **No false balance** | The report must pick a winner based on evidence |
| **Cross-verification** | Both sides fact-check the opponent's top 3 claims |
| **Early termination** | Debate stops when arguments start repeating |
| **Parallel execution** | Independent phases run concurrently |
| **Adversarial by design** | Each side is prompted to attack, not agree |

---

## Timing

Typically **3-5 minutes** depending on round count. MCP mode is slightly faster than CLI fallback.

---

## Notes

- Debate logs live in `/tmp` and are lost on reboot. Copy them if you need to keep them.
- Investment/stock debates are for reference only, not financial advice.
- Codex CLI works with ChatGPT Plus or Pro Plan auth. API key usage is billed separately.

---

<p align="center">
  <em>"The test of a first-rate intelligence is the ability to hold two opposing ideas in mind at the same time and still retain the ability to function."</em>
  <br/>
  <sub>F. Scott Fitzgerald</sub>
  <br/><br/>
  <strong>Let two AIs hold those ideas. You just read the verdict.</strong>
  <br/><br/>
  <code>MIT License</code>
</p>
