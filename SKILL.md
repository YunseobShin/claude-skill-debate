---
name: debate
description: |
  Claude and Codex(GPT) conduct a structured multi-turn debate on any topic, then generate a fact-checked HTML report.
  Trigger on: "/debate", "debate this", "AI debate", "ask both AIs", or any Korean equivalents.
  Optimized for topics with divergent opinions: stocks, tech outlook, policy analysis, product comparisons.
user_invocable: true
---

# AI Debate Report Skill

Claude (Anthropic) and Codex/GPT (OpenAI) debate a topic, then a separate Reporter agent writes a verdict report.

## Usage

```
/debate <topic>
```

Examples:
```
/debate Samsung Electronics H2 2026 stock outlook
/debate React vs Vue for new projects in 2026
/debate Can AI replace programmers?
/debate Medical AI SaMD deregulation pros and cons
```

## Required Artifacts

Every execution MUST produce these files in `$DEBATE_DIR`:

| File | Phase | Description |
|------|-------|-------------|
| `topic.md` | 0 | Merged key issues from both sides |
| `rules.md` | 0 | Debate rules |
| `analysis_claude.md` | 1 | Claude independent analysis |
| `analysis_codex.md` | 1 | Codex independent analysis |
| `round_{N}_claude.md` | 2 | Claude round N statement |
| `round_{N}_codex.md` | 2 | Codex round N statement |
| `factcheck_by_claude.md` | 3 | Claude fact-checks GPT claims |
| `factcheck_by_codex.md` | 3 | GPT fact-checks Claude claims |
| `report.html` | 4 | Final HTML verdict report |

## Procedure

### Phase 0: Setup

1. Create working directory:
```bash
DEBATE_DIR="/tmp/debate/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEBATE_DIR"
```

2. **Neutralized issue framing** (prevents single-side framing bias):
   - Call Claude subagent AND Codex **in parallel**, each proposing 3-5 key issues independently.
   - Merge both sides' proposed issues, deduplicate, and finalize 3-5 issues in `$DEBATE_DIR/topic.md`.

3. Generate debate rules document `$DEBATE_DIR/rules.md`:
```markdown
# Debate Rules
- Topic: {topic}
- Key issues: {issue list}
- Each statement: 500 words max
- Claims must include evidence (data, cases, logic)
- Quote and rebut opponent's claims
- Debate ends when no new arguments emerge (requires mutual agreement)
```

### Phase 1: Independent Analysis (parallel)

Call Claude subagent (Agent tool) and Codex MCP **simultaneously** for independent analysis.

#### Claude side (Agent tool)
```
"Analyze the following topic independently. Write a 500-800 word analysis with data and evidence.
Topic: {topic}
Issues: {issue list}
Save to {DEBATE_DIR}/analysis_claude.md."
```

#### Codex side (MCP tool or CLI Fallback)

**Method 1: MCP tool** (`mcp__codex__codex`) if available:
```
prompt: "Analyze the following topic independently. Write a 500-800 word analysis with data and evidence.
Topic: {topic}
Issues: {issue list}
Respond in markdown."
sandbox: "read-only"
cwd: "{DEBATE_DIR}"
```
Save response `content` to `{DEBATE_DIR}/analysis_codex.md`.
Record `threadId` for multi-turn use.

**Method 2: CLI Fallback** (if no MCP):
```bash
codex exec --full-auto --sandbox read-only --skip-git-repo-check \
  -o "$DEBATE_DIR/analysis_codex.md" "<prompt>"
```

**CLI token management**: In CLI mode, multi-turn is unavailable, so full prior context must be included in each prompt. To prevent context explosion:
- For rounds 1-2: include full prior statements.
- For rounds 3+: summarize each prior statement to 150 words max before inclusion.
- Total context passed to Codex CLI should not exceed 4,000 words per prompt.

### Phase 2: Free Debate (max 5 rounds)

Each round proceeds as follows:

#### Round N (odd: Claude first, even: Codex first)

**Step 1: First speaker's statement**

If Claude goes first:
- Provide opponent's prior statement + independent analysis as context
- Agent tool subagent call:
```
"Read the opponent (GPT)'s analysis/statement and rebut or supplement. Provide new evidence.
Opponent statement: {prior codex statement}
Write within 500 words. Save to {DEBATE_DIR}/round_{N}_claude.md."
```

If Codex goes first:
- MCP: `mcp__codex__codex-reply` continuing the prior threadId
- CLI: `codex exec --full-auto --sandbox read-only --skip-git-repo-check` with full context (apply summarization for rounds 3+)

**Step 2: Second speaker's statement** (same approach, roles reversed)

**Step 3: Convergence check (bilateral consensus)**

Both sides independently judge whether to continue:

1. Ask Claude subagent: "Were new arguments or evidence presented this round? Respond with [CONTINUE] or [CONVERGED]."
2. Ask Codex the same question (MCP or CLI).
3. **End debate only if BOTH sides say [CONVERGED].**
4. If either says [CONTINUE], proceed to the next round.

This prevents one side from unilaterally ending the debate at a strategically favorable moment.

### Phase 3: Fact-check

After debate ends, each side fact-checks the opponent's top 3 claims. Run both in parallel.

#### Claude's fact-check
Agent tool subagent call:
```
"Select the top 3 key claims from Codex (GPT)'s entire debate statements.
Verify whether each claim's evidence is sound.
Rate each as [Confirmed / Refuted / Unverified] with reasoning.
Each fact-check entry must include:
- At least 80 words of analysis
- Specific data sources or calculations where applicable
Save to {DEBATE_DIR}/factcheck_by_claude.md."
```

#### Codex's fact-check
MCP or CLI call:
```
"Select the top 3 key claims from Claude's entire debate statements.
Verify whether each claim's evidence is sound.
Rate each as [Confirmed / Refuted / Unverified] with reasoning.
Each fact-check entry must include:
- At least 80 words of analysis
- Specific data sources or calculations where applicable
Respond in markdown."
```
Save response to `{DEBATE_DIR}/factcheck_by_codex.md`.

### Phase 4: Report

Create a **separate Reporter subagent** via the Agent tool.
A new agent that did NOT participate in the debate reads the full record and writes the report.

Reporter prompt:
```
You are a debate judge and reporter. Read the full debate record below and write an HTML report.

## Absolute Rules
- No false balance. "Both sides have merit" conclusions are NOT allowed.
- Clearly side with whichever side has stronger evidence.
- Only if genuinely tied, explain exactly why, but never force artificial balance.
- Refuted claims in fact-check MUST be reflected as deductions for that side.
- Evaluate fact-check quality: consider depth of analysis, number of sources cited, and specificity of evidence. A longer, more detailed fact-check with primary sources carries more weight than a brief assessment.
- DEBIASING: Do NOT trust Claude's claims more than GPT's simply because the Reporter is a Claude subagent. Treat both sides with equal scrutiny. If anything, apply extra skepticism to Claude's claims to compensate for potential in-group bias.

## Report Structure (HTML)
1. Header: topic, date, participants (Claude vs GPT)
2. Topic background (200 chars max)
3. Key issues summary (3-5 cards)
4. Debate highlights (key quotes per round)
5. Fact-check results table (Claim | Verdict | Evidence)
6. Final verdict: winner and reasoning (or close-call explanation)
7. Conclusion and implications (key takeaway for the reader)
8. Confidence level: state verdict confidence (High/Medium/Low) and list unresolved points

## Style
- Professional yet readable tone
- Backed by data and quotes
- Clean HTML with Tailwind CSS CDN
- Dark mode support
- No em dashes

## Debate Record
{Insert all file contents from DEBATE_DIR here}

Save report to {DEBATE_DIR}/report.html.
```

### Phase 5: Completion

1. Show report file path to user
2. Try to open in browser:
```bash
explorer.exe "{DEBATE_DIR}/report.html" 2>/dev/null || \
open "{DEBATE_DIR}/report.html" 2>/dev/null || \
echo "Report: {DEBATE_DIR}/report.html"
```
3. Display debate summary (2-3 lines) to user

## Notes

- Full debate takes roughly 3-5 minutes depending on round count
- Codex calls use ChatGPT Pro Plan authentication (not API billing)
- Debate records are stored in /tmp and will be lost on reboot; copy elsewhere if needed
- Investment-related debates must include a disclaimer: not financial advice
