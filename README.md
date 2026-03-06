# claude-skill-debate

Claude(Anthropic)와 Codex/GPT(OpenAI)가 특정 주제에 대해 멀티턴 토론을 벌이고, 교차 팩트체크 후 HTML 판정 리포트를 자동 생성하는 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 스킬입니다.

<p align="center">
  <img src="assets/debate-flow.png" alt="Debate Flow" width="600">
</p>

## 특징

- **독립 분석**: Claude와 GPT가 각각 독립적으로 주제를 분석
- **멀티턴 토론**: 최대 5라운드 자유 토론 (수렴 시 자동 조기 종료)
- **교차 팩트체크**: 양측이 상대방 핵심 주장 3개를 검증
- **HTML 리포트**: Tailwind CSS 기반, 다크모드 지원 판정 리포트 자동 생성
- **양비론 금지**: 근거가 강한 쪽의 손을 명확히 드는 판정

## 전제 조건

### 필수

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI 설치 및 인증
- [OpenAI Codex CLI](https://github.com/openai/codex) 설치 및 인증

### Codex CLI 설치

```bash
npm install -g @openai/codex
```

인증은 ChatGPT Pro Plan 계정으로 로그인하거나, OpenAI API 키를 설정합니다:

```bash
# 방법 1: ChatGPT Pro Plan 인증 (무제한 토큰)
codex auth login

# 방법 2: API 키 (과금됨)
export OPENAI_API_KEY="sk-..."
```

### 선택 (권장)

Codex MCP 서버를 설정하면 멀티턴 토론이 가능하여 더 깊은 토론이 진행됩니다.

`~/.claude/settings.json`에 추가:

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

MCP가 없으면 자동으로 CLI fallback을 사용합니다 (매 라운드 전체 컨텍스트를 프롬프트에 포함).

## 설치

### 방법 1: 수동 복사

```bash
# 스킬 디렉토리 생성
mkdir -p ~/.claude/skills/debate

# SKILL.md 복사
cp SKILL.md ~/.claude/skills/debate/SKILL.md
```

### 방법 2: Git clone

```bash
git clone https://github.com/YOUR_USERNAME/claude-skill-debate.git
mkdir -p ~/.claude/skills/debate
cp claude-skill-debate/SKILL.md ~/.claude/skills/debate/SKILL.md
```

## 사용법

Claude Code에서 `/debate` 뒤에 토론 주제를 입력합니다:

```
/debate 삼성전자 2026년 하반기 주가 전망
```

```
/debate React vs Vue 2026년 신규 프로젝트 기준
```

```
/debate AI가 프로그래머를 대체할 수 있는가
```

```
/debate 의료 AI SaMD 규제 완화 찬반
```

자연어로도 호출 가능합니다:

```
"이 주제로 AI 두 마리 토론시켜줘"
"Claude랑 GPT한테 물어봐"
```

## 토론 흐름

```
Phase 0: 준비
  주제 → 핵심 논점 3-5개 도출 → 토론 규칙 생성

Phase 1: 독립 분석 (병렬)
  Claude 서브에이전트 ──┐
                        ├──→ 각각 500-800단어 분석문
  Codex (MCP/CLI)  ─────┘

Phase 2: 자유 토론 (최대 5라운드)
  ┌─ Round 1: Claude 선공 → Codex 반박
  ├─ Round 2: Codex 선공 → Claude 반박
  ├─ ...
  └─ 수렴 판정: 새 논점 없으면 조기 종료

Phase 3: 교차 팩트체크
  Claude → GPT 주장 상위 3개 검증
  Codex  → Claude 주장 상위 3개 검증

Phase 4: 리포트 작성
  별도 Reporter 에이전트가 전체 기록을 읽고 HTML 판정 리포트 생성

Phase 5: 완료
  리포트 브라우저 자동 열기 + 토론 요약 표시
```

## 출력물

### 토론 기록 (마크다운)

`/tmp/debate/YYYYMMDD_HHMMSS/` 디렉토리에 저장:

| 파일 | 설명 |
|------|------|
| `topic.md` | 주제 및 핵심 논점 |
| `rules.md` | 토론 규칙 |
| `analysis_claude.md` | Claude 독립 분석 |
| `analysis_codex.md` | GPT 독립 분석 |
| `round_N_claude.md` | N라운드 Claude 발언 |
| `round_N_codex.md` | N라운드 GPT 발언 |
| `factcheck_by_claude.md` | Claude의 팩트체크 |
| `factcheck_by_codex.md` | GPT의 팩트체크 |
| `report.html` | 최종 HTML 판정 리포트 |

### HTML 리포트 구조

1. 헤더 (주제, 날짜, 참가자)
2. 주제 배경
3. 핵심 쟁점 요약 (카드 형태)
4. 토론 하이라이트 (라운드별 핵심 발언 인용)
5. 팩트체크 결과표
6. 최종 판정 (승자와 이유)
7. 결론 및 시사점
8. 면책 조항

## 소요 시간

- 일반적으로 3-5분 (라운드 수에 따라)
- MCP 모드가 CLI fallback보다 약간 빠름

## 주의사항

- 토론 기록은 `/tmp`에 저장되므로 재부팅 시 사라집니다. 보관이 필요하면 별도로 복사하세요.
- 주식/투자 관련 토론 결과는 참고용이며 투자 조언이 아닙니다.
- Codex CLI는 ChatGPT Pro Plan 인증 시 무제한 토큰, API 키 사용 시 과금됩니다.

## 라이선스

MIT

## 관련 프로젝트

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
