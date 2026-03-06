---
name: debate
description: |
  Claude와 Codex(GPT)가 특정 주제에 대해 멀티턴 토론을 벌이고, 팩트체크 후 HTML 리포트를 생성하는 스킬.
  "/debate", "토론시켜", "AI 토론", "두 AI한테 물어봐", "debate" 등의 요청 시 사용.
  주식, 기술 전망, 정책 분석, 제품 비교 등 의견이 갈릴 수 있는 주제에 최적화.
user_invocable: true
---

# AI Debate Report Skill

Claude(Anthropic)와 Codex/GPT(OpenAI)가 주제에 대해 토론하고, 별도 Reporter가 판정 리포트를 작성한다.

## 사용법

```
/debate <주제>
```

예시:
```
/debate 삼성전자 2026년 하반기 주가 전망
/debate React vs Vue 2026년 신규 프로젝트 기준
/debate AI가 프로그래머를 대체할 수 있는가
/debate 의료 AI SaMD 규제 완화 찬반
```

## 실행 절차

### Phase 0: 준비

1. 작업 디렉토리 생성:
```bash
DEBATE_DIR="/tmp/debate/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEBATE_DIR"
```

2. 주제에서 핵심 논점 3-5개를 도출하여 `$DEBATE_DIR/topic.md`에 저장.

3. 토론 규칙 문서 `$DEBATE_DIR/rules.md` 생성:
```markdown
# Debate Rules
- 주제: {주제}
- 핵심 논점: {논점 리스트}
- 각 발언은 500단어 이내
- 주장에는 반드시 근거(데이터, 사례, 논리)를 포함
- 상대방 주장을 인용하며 반박할 것
- 새로운 논점 없이 반복하면 토론 종료
```

### Phase 1: 독립 분석 (병렬)

Claude 서브에이전트(Agent 도구)와 Codex MCP를 **동시에** 호출하여 각자 독립 분석을 수행한다.

#### Claude 측 (Agent 도구)
Agent 도구로 서브에이전트를 생성한다:
```
프롬프트: "다음 주제에 대해 독자적으로 분석하라. 데이터와 근거를 포함한 500-800단어 분석문을 작성하라.
주제: {주제}
논점: {논점 리스트}
결과를 {DEBATE_DIR}/analysis_claude.md 에 저장하라."
```

#### Codex 측 (MCP 도구 또는 CLI Fallback)

**방법 1: MCP 도구** (`mcp__codex__codex`)가 있는 경우:
```
prompt: "다음 주제에 대해 독자적으로 분석하라. 데이터와 근거를 포함한 500-800단어 분석문을 작성하라.
주제: {주제}
논점: {논점 리스트}
마크다운 형식으로 응답하라."
sandbox: "read-only"
cwd: "{DEBATE_DIR}"
```
응답의 `content`를 `{DEBATE_DIR}/analysis_codex.md`에 저장한다.
`threadId`를 기록해둔다 (이후 멀티턴에 사용).

**방법 2: CLI Fallback** (MCP가 없는 경우):
```bash
codex exec --full-auto --sandbox read-only --skip-git-repo-check \
  -o "$DEBATE_DIR/analysis_codex.md" "<프롬프트>"
```
CLI 모드에서는 멀티턴이 불가하므로, 매 라운드마다 이전 토론 전체 컨텍스트를 프롬프트에 포함한다.

### Phase 2: 자유 토론 (최대 5라운드)

각 라운드는 다음 순서로 진행된다:

#### 라운드 N (홀수: Claude 선공, 짝수: Codex 선공)

**Step 1: 선공 측 발언**

선공이 Claude인 경우:
- 이전 라운드의 상대방 발언 + 독립분석을 컨텍스트로 제공
- Agent 도구로 서브에이전트 호출:
```
"상대방(GPT)의 분석/발언을 읽고 반박 또는 보충하라. 새로운 근거를 제시하라.
상대방 발언: {이전 codex 발언}
500단어 이내로 작성. {DEBATE_DIR}/round_{N}_claude.md 에 저장."
```

선공이 Codex인 경우:
- MCP: `mcp__codex__codex-reply`로 이전 threadId에 이어서 호출
- CLI: `codex exec --full-auto --sandbox read-only --skip-git-repo-check`로 전체 컨텍스트 포함 호출

**Step 2: 후공 측 발언** (같은 방식, 역할 반전)

**Step 3: 수렴 판정**

Claude가 이번 라운드의 양쪽 발언을 읽고 판단한다:
- 새로운 논점이나 근거가 제시되었는가?
- 양쪽이 같은 주장을 반복하고 있는가?

새 논점이 없으면 토론을 조기 종료한다.

### Phase 3: 팩트체크

토론 종료 후, 양쪽이 상대방의 핵심 주장 상위 3개를 선별하여 검증한다.

#### Claude의 팩트체크
Agent 도구로 서브에이전트 호출:
```
"Codex(GPT)의 토론 전체 발언에서 핵심 주장 3개를 선별하고,
각 주장의 근거가 타당한지 검증하라.
검증 결과를 [확인됨/반박됨/미검증] 으로 판정하고 이유를 작성하라.
{DEBATE_DIR}/factcheck_by_claude.md 에 저장."
```

#### Codex의 팩트체크
MCP 또는 CLI로 호출:
```
"Claude의 토론 전체 발언에서 핵심 주장 3개를 선별하고,
각 주장의 근거가 타당한지 검증하라.
검증 결과를 [확인됨/반박됨/미검증] 으로 판정하고 이유를 작성하라.
마크다운 형식으로 응답."
```
응답을 `{DEBATE_DIR}/factcheck_by_codex.md`에 저장.

### Phase 4: 리포트 작성

**별도 Reporter 서브에이전트**를 Agent 도구로 생성한다.
토론에 참여하지 않은 새로운 에이전트가 전체 기록을 읽고 리포트를 작성한다.

Reporter 프롬프트:
```
너는 토론 심판이자 리포터다. 아래 토론 기록 전체를 읽고 HTML 리포트를 작성하라.

## 절대 규칙
- 양비론 금지. "양쪽 다 일리가 있다"는 결론은 허용하지 않는다.
- 근거가 더 강한 쪽의 손을 명확히 들어라.
- 동점인 경우에만 그 이유를 구체적으로 명시하되, 억지로 균형을 맞추지 마라.
- 팩트체크에서 반박된 주장은 해당 측의 감점 요소로 반영하라.

## 리포트 구조 (HTML)
1. 헤더: 주제, 날짜, 참가자 (Claude vs GPT)
2. 주제 배경 (200자 이내)
3. 핵심 쟁점 요약 (3-5개, 카드 형태)
4. 토론 하이라이트 (라운드별 핵심 발언 인용)
5. 팩트체크 결과표 (주장 | 판정 | 근거)
6. 최종 판정: 승자와 이유 (또는 근소한 차이면 그 설명)
7. 결론 및 시사점 (독자가 가져갈 핵심 메시지)

## 스타일
- 전문적이면서 읽기 쉬운 톤
- 데이터와 인용으로 뒷받침
- 시각적으로 깔끔한 HTML (Tailwind CSS CDN 사용)
- 다크모드 지원

## 토론 기록
{DEBATE_DIR 내 모든 파일 내용을 여기에 삽입}

리포트를 {DEBATE_DIR}/report.html 에 저장하라.
```

### Phase 5: 완료

1. 리포트 파일 경로를 사용자에게 안내
2. 가능하면 브라우저로 자동 열기:
```bash
explorer.exe "{DEBATE_DIR}/report.html" 2>/dev/null || \
open "{DEBATE_DIR}/report.html" 2>/dev/null || \
echo "리포트: {DEBATE_DIR}/report.html"
```
3. 토론 요약 (2-3줄)을 사용자에게 표시

## 주의사항

- 전체 토론에 약 3-5분 소요될 수 있음 (라운드 수에 따라)
- Codex 호출은 ChatGPT Pro Plan 인증 사용 (API 과금 아님)
- 토론 기록은 /tmp에 저장되므로 재부팅 시 사라짐. 보관 필요시 별도 복사
- 주식/투자 관련 토론은 참고용이며 투자 조언이 아님을 리포트에 명시
