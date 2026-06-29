# Roadmap

## Purpose

Describes the four development phases (V0–V3), what each phase includes, current completion status, and what blocks progress to the next phase.

---

## Overview

| Phase | Name | Status | Primary Goal |
|---|---|---|---|
| V0 | Core Learning Experience | ✅ Near-complete | Functional app, one learning session end-to-end |
| V1 | Educational Data Engine | 🔨 Partial | Data infrastructure for educational research |
| V2 | TinyLLM Specialization | ⏳ Not started | Replace rule-based AI with specialized LLM |
| V3 | Intelligent Learning Ecosystem | ⏳ Not started | Adaptive pathways, persistent mentor, community |

---

## V0 — Core Learning Experience

### Goal

A working prototype that demonstrates the full learning session: scenario browsing → reasoning input → abstraction mapping → code generation → prompt scoring → reflection capture.

### What Is Included

- Scenario browser with difficulty, concept, and search filters
- Interactive learning session form (reasoning, prompt, reflection)
- AI Mentor Output panel with abstraction map, generated code, prompt feedback, and misconception signals
- Dashboard: concept mastery bars, roadmap phases, recent sessions
- Roadmap visualization (V0–V3)
- JSON file-backed API with seed data (30 scenarios)
- Deterministic local AI logic (rule-based, no external API)

### What Is Still Missing (V0 Gaps)

> These are not "nice to have" — they are what separates V0 as-built from V0 as-designed.

- [ ] **Scenario editor UI** — Can only add scenarios via raw `POST /api/scenarios`. Need a UI editor for educators without API access.
- [ ] **Input validation** — No server-side body validation; malformed submissions accepted silently.
- [ ] **Request validation** — No middleware to validate required fields, types, or constraints on `POST /sessions` and `POST /scenarios`.
- [ ] **Unit tests** — No test coverage for any module, especially `learningEngine.js`.
- [ ] **Error boundaries** — React has no error boundary; a runtime error crashes the full app.
- [ ] **Session pagination** — `GET /api/sessions` returns up to 30, hardcoded; no offset/limit parameters.
- [ ] **Misconception tracking persistence** — Misconceptions are returned per session but not aggregated for research.

### Gate to V1

V0 is complete when a new contributor can:
1. Clone the repo, run `npm run installAll && npm run seed && npm run dev`
2. Complete a full learning session without seeing any error
3. Read [LEARNING_ENGINE](./LEARNING_ENGINE.md) and understand exactly what each function does

---

## V1 — Educational Data Engine

### Goal

Build the data infrastructure needed for serious educational research: learner profiles, prompt persistence, misconception dataset, and scenario effectiveness tracking.

### What Is Included

- **Scenario Database** — Structured scenario storage with full versioning history (who changed what, when)
- **Learner Interaction Logging** — Per-learner session history with named profiles instead of "Guest learner"
- **Reflection Storage** — Structured reflection data with keyword tagging
- **Misconception Dataset** — Persistent, structured storage of detected misconceptions linked to session context
- **Prompt Dataset Builder** — Every `(scenarioId, reasoning, promptText, score, feedback)` tuple is persisted for later analysis
- **Scenario Effectiveness Tracking** — Real-time `effectivenessScore` derived from learner outcomes, not pre-seeded
- **Real Database Migration** — Replace `db.json` with a proper database (SQLite recommended for local, PostgreSQL for deployed)

### What Blocks V1

- V0 gaps must be closed first (especially scenario editor and input validation)
- Prompt dataset persistence requires a database; JSON file does not support the query patterns needed
- Learner profiles require auth or at least a session token mechanism (even a simple one)

---

## V2 — TinyLLM Specialization

### Goal

Replace the rule-based AI stub with a specialized LLM that provides genuinely educational feedback: richer abstraction mapping, contextual misconception detection, adaptive scenario generation, and prompt grading that reflects real mentoring quality.

### What Is Included

- **RAG Pipeline** — Retrieval-Augmented Generation using the scenario corpus, misconception taxonomy, and prompt dataset
- **Educational Retrieval Engine** — Given a learner's reasoning, retrieve relevant scenarios, misconceptions, and code examples to ground the AI response
- **Prompt Grading Model** — LLM-based prompt evaluator trained on the collected prompt dataset
- **Scenario Generation Model** — Given a concept and difficulty level, generate a new scenario (validated by an educator before going live)
- **Misconception Detection Model** — LLM-based detection trained on the misconception taxonomy + real session data
- **AI Integration Interface** — A clean adapter layer for swapping between local TinyLLM, OpenAI, and other providers

### What Blocks V2

- Prompt dataset must have sufficient volume (recommend 200+ sessions minimum)
- Misconception taxonomy must be substantially populated from real learner data (Phase 2)
- [AI_INTEGRATION.md](./AI_INTEGRATION.md) interface contract must be finalized and tested

---

## V3 — Intelligent Learning Ecosystem

### Goal

Transform PyBe from a tool into a platform: personalized learning pathways, a persistent AI mentor that remembers the learner, gamification, and a community of educators sharing scenarios and research.

### What Is Included

- **Learner Dashboard** — Per-learner progress view: concepts mastered, misconceptions resolved, prompt maturity trajectory
- **Gamification System** — Achievement badges, concept streaks, scenario completion milestones
- **Adaptive Learning Engine** — Given a learner's profile, recommend the next scenario that maximizes learning efficiency
- **Persistent AI Mentor** — The mentor remembers previous sessions, refers back to earlier misconceptions, and adjusts feedback style
- **Community Ecosystem** — Educator accounts, scenario submission and review workflow, shared scenario library, public research data export

### What Blocks V3

- V2 AI integration must be stable and evaluated
- Learner model must be validated (Phase 2 research plan)
- Community features require governance documentation (Phase 3)

---

## Phase Relationships

```
V0 (complete the gaps)
    │
    ▼
V1 (build data infrastructure)
    │
    ├─→ Prompt dataset (collected in V1)
    ├─→ Misconception taxonomy (populated in V1)
    └─→ Real database (migrated in V1)
            │
            ▼
        V2 (replace rule-based AI)
            │
            ├─→ RAG pipeline (needs V1 prompt dataset)
            ├─→ Prompt grading model (needs V1 prompt dataset)
            └─→ Misconception detection model (needs V1 misconception data)
                    │
                    ▼
                V3 (adaptive + community)
```

---

## Relationship to Other Phase 1 Documents

- [ROADMAP](./ROADMAP.md) ← you are here
- [VISION](./VISION.md) ← defines the success criteria that each phase serves
- [PROJECT_ANALYSIS](./PROJECT_ANALYSIS.md) ← maps the current codebase to V0 gaps
- [CASE_STUDIES](./CASE_STUDIES.md) ← shows what V0 looks like in practice