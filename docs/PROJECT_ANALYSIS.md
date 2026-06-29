# PyBe Project Analysis

**Date:** 2026-06-29
**Analyst:** PyBe Assistant 🐍
**Repo:** `C:\Users\skaja\OneDrive\Desktop\pybe\pybe`

---

## 1. Project Overview

**What is PyBe?**

PyBe is a **scenario-driven Python learning prototype** built as a MERN-style application. It guides learners through a pedagogical flow: present a real-world situation → ask the learner to reason about it → map that reasoning to Python constructs → generate code → give feedback on the learner's prompting quality.

The key insight driving the product is that learners should **reason before they code**. The tool is the medium; the mental modeling is the skill.

**Current status:** V0 prototype. Fully functional, runs locally, no external dependencies beyond Node.js.

---

## 2. Repository Structure

```
pybe/
├── docs/                        # ← this report lives here
├── client/                      # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── main.jsx             # Entire SPA: sidebar, workspace, dashboard
│       └── styles.css           # Plain CSS, no preprocessor
├── server/                      # Express API
│   ├── package.json
│   ├── package-lock.json
│   ├── .env                     # PORT=5000, CLIENT_ORIGIN=http://localhost:5173
│   ├── .env.example
│   └── src/
│       ├── index.js             # Express app setup, CORS, routes
│       ├── seed.js              # Seeds 30 scenarios into db.json
│       ├── data/
│       │   ├── db.json          # Live data store (scenarios + sessions)
│       │   ├── roadmap.js       # V0–V3 roadmap definitions
│       │   └── store.js         # CRUD abstraction over db.json
│       ├── routes/
│       │   ├── analytics.js     # GET /api/analytics
│       │   ├── roadmap.js       # GET /api/roadmap
│       │   ├── scenarios.js     # GET/POST /api/scenarios, GET /api/scenarios/:id
│       │   └── sessions.js      # GET/POST /api/sessions
│       └── services/
│           └── learningEngine.js  # Core rule-based AI logic
├── package.json                 # Root: runs installAll, dev, seed via concurrently
├── README.md
└── WIKI.md
```

---

## 3. Frontend Architecture

**Stack:** React 18 + Vite 6, plain CSS, lucide-react icons, no React Router.

### 3.1 Component Structure

The entire frontend is a **single component tree in `main.jsx`** (~260 lines). There are no separate component files. Components defined within the same file:

| Component | Role |
|---|---|
| `App` | Root — holds all state, all API calls, all filters |
| `Result` | Renders the AI Mentor Output panel |
| `EmptyResult` | Placeholder when no session submitted yet |
| `Analytics` | Concept mastery bars from analytics data |
| `Roadmap` | Phase cards from roadmap data |
| `SessionList` | Recent sessions list |

### 3.2 State Management

All state lives in `App` via `useState` / `useEffect` — no context, no store, no reducers:

```
scenarios, selected, sessions, analytics, roadmap
filters (q, difficulty, concept)
form (learnerName, reasoning, promptText, reflection)
activeResult, loading, submitting
```

### 3.3 API Layer

Single `api()` helper function hitting `VITE_API_URL` (defaults to `http://localhost:5000/api`). Four endpoints:

- `GET /api/scenarios` — with optional `q`, `concept`, `difficulty` query params
- `GET /api/sessions` — last 30 sessions
- `GET /api/analytics` — aggregated stats
- `GET /api/roadmap` — V0–V3 phase list
- `POST /api/sessions` — submit a learning session

### 3.4 UI Layout

Two-column layout (sidebar 320px + workspace), three-panel dashboard below. Responsive at 1050px and 640px breakpoints.

### 3.5 Styling

Single `styles.css` — ~300 lines of custom CSS using CSS variables, CSS Grid, and Flexbox. Color palette: dark forest green sidebar (#16231f), warm cream background (#f4f1ea), lime green accent (#d8f07c).

---

## 4. Backend Architecture

**Stack:** Node.js + Express 4, no database (JSON file), no ORM.

### 4.1 Entry Point (`index.js`)

- CORS enabled for `CLIENT_ORIGIN`
- `express.json()` middleware
- `morgan('dev')` logging
- Four route mounts + health endpoint
- Global error handler

### 4.2 Data Layer (`store.js`)

A thin file-based CRUD layer over `db.json`. All operations are async (fs/promises). Key functions:

| Function | Description |
|---|---|
| `readDb()` / `writeDb()` | File I/O with ensure-on-read |
| `listScenarios(filters)` | Filter by difficulty, concept, text query; sort by effectivenessScore |
| `getScenario(id)` | Find one scenario by UUID |
| `addScenario(input)` | Append to db.scenarios |
| `listSessions()` | Sessions with joined scenario objects, sorted by createdAt desc |
| `addSession(input)` | Append to db.sessions |
| `resetData(scenarios)` | Wipes and reseeds — used by `npm run seed` |

All records get `_id` (UUID v4), `createdAt`, `updatedAt`.

### 4.3 Routes

**`scenarios.js`** — `GET /` (list with filters), `POST /` (add), `GET /:id` (get one)
**`sessions.js`** — `GET /` (list last 30), `POST /` (create — the main learning flow)
**`analytics.js`** — `GET /` — aggregates concept counts, misconception counts, avg prompt score
**`roadmap.js`** — `GET /` — static data from `roadmap.js`

### 4.4 The Learning Engine (`learningEngine.js`)

The intellectual core of the application. Six exported functions:

**`mapReasoning(reasoning)`** — keyword matching against 6 concept rules:
- Repetition → `for/while` loops
- Decision making → `if/elif/else`
- Collection handling → lists/dicts
- Computation → variables + arithmetic
- Reusable procedure → functions
- Selection/filtering → comparisons + list comprehensions

If no keyword matches, defaults to "Sequential thinking" → statements/variables.

**`generateCode(scenario, maps)`** — Template-based Python code generator. Has hardcoded branches for (loop + condition), (function), (loop), (condition), default. The generated code does NOT incorporate the specific scenario context — it's generic.

**`explainCode(maps)`** — Natural language explanation of which patterns map to which Python concepts.

**`evaluatePrompt(promptText)`** — Scores prompt maturity 0–100 based on:
- Length > 40 chars: +15
- Contains "step/explain/why/reason": +20
- Contains "example/input/output/data": +15
- Contains "python/loop/if/list/function": +15

**`detectMisconceptions(reasoning)`** — Flag absolute language ("always/never") and very short reasoning.

**`masterySignals(maps, promptScore)`** — Generates human-readable signals from abstraction map and score.

---

## 5. Data — Seeded Scenarios

30 scenarios across 3 difficulty tiers, stored in `db.json`. Each has: `_id`, `title`, `difficulty`, `concepts[]`, `context`, `prompt`, `objectives[]`, `sampleReasoning`, `effectivenessScore`, `createdAt`, `updatedAt`.

| Tier | Count | Concepts covered |
|---|---|---|
| Beginner | 10 | variables, conditionals, arithmetic, strings, comparisons, subtraction, lists, indexing, counting |
| Explorer | 10 | loops, comparisons, filtering, dictionaries, search, averages, modulo, strings (title case), sets |
| Builder | 10 | functions, while loops, validation, dictionaries (mutation), formatting, adaptive logic, strings (search) |

**No sessions exist in db.json** — the sessions array is empty.

---

## 6. Inferred Project Goals (from code)

The roadmap.js defines V0–V3:

| Phase | Status | Summary |
|---|---|---|
| **V0** — Core Learning Experience | ✅ Near-complete | Scenario browser, abstraction mapping, prompt scoring, code generation, reflection capture |
| **V1** — Educational Data Engine | ⚠️ Partial | Session logging works; but no scenario editor, no misconception dataset builder, no prompt dataset |
| **V2** — TinyLLM Specialization | ❌ Not started | RAG pipeline, retrieval engine, prompt grading model, scenario generation, misconception detection via LLM |
| **V3** — Intelligent Learning Ecosystem | ❌ Not started | Adaptive learning, persistent AI mentor, gamification, community |

The README explicitly states: *"The AI behavior in this prototype is deterministic and local... Later phases can replace those services with OpenAI, RAG, or TinyLLM components."*

---

## 7. Missing Documentation

1. **No API documentation** — No OpenAPI/Swagger, no API.md. Routes are simple but not documented.
2. **No CONTRIBUTING.md** — No development guidelines, commit conventions, or PR process.
3. **No CHANGELOG** — No history of what changed and when.
4. **`docs/` folder is empty** (besides this report) — No architecture decision records, design docs, or pedagogical documentation.
5. **No inline comments in `main.jsx`** — The learning flow logic is opaque.
6. **`learningEngine.js` has no comments** — The keyword rules and scoring logic are undocumented.
7. **No `db.json` schema documentation** — Field types, constraints, and relationships are implicit.

---

## 8. Missing Architectural Components

### Critical (for V0 completeness)
1. **No scenario editor UI** — Can only add scenarios via raw POST to the API. A CRUD editor in the UI would complete V0.
2. **No input validation** — Server accepts any fields; client sends whatever is typed. No schema validation (e.g., no `zod`, `joi`, `ajv`).
3. **No session pagination** — `listSessions` returns up to 30, but no offset/limit.

### Important (for V1)
4. **No real database** — JSON file won't scale. V1 calls for a "Scenario Database." A real DB (SQLite, PostgreSQL, or MongoDB) would be the right move before adding more data.
5. **No learner identity/auth** — "Guest learner" is hardcoded. V1 calls for "Learner Interaction Logging," which needs identity.
6. **No misconception tracking persistence** — Misconceptions are detected and returned per-session but not aggregated into a persistent dataset for research.
7. **No prompt dataset builder** — V1 calls for a "Prompt Dataset Builder." There's no UI or export for collecting prompts for later model fine-tuning.

### Missing for V2/V3
8. **No AI integration points** — `learningEngine.js` is a stub. There are no service interfaces, adapters, or configuration hooks for plugging in OpenAI, a local LLM, or RAG.
9. **No RAG pipeline** — V2 calls for educational retrieval. No vector store, no embedding pipeline, no retrieval logic.
10. **No adaptive learning engine** — V3 calls for personalized pathways. No learner model, no recommendation logic, no difficulty adjustment beyond the seed data.

---

## 9. Code Quality Issues

1. **`generateCode()` is template-based, not scenario-aware** — It generates generic loop/function/conditional boilerplate regardless of the scenario context. The `scenario` parameter is only used for the title in the default branch. This significantly limits educational value.

2. **All frontend in one file** — `main.jsx` is 260+ lines with 7 components. No separation of concerns makes the learning flow hard to maintain, test, or extend.

3. **No unit tests anywhere** — No Jest, Vitest, Mocha, or any test suite. The `learningEngine.js` rules have no test coverage.

4. **No error boundaries** — React has no error boundary; a runtime error in any component crashes the whole app.

5. **`morgan` logging to stdout only** — No structured logging, no log rotation, no log levels.

6. **CORS wide-open in dev** — `origin: 'http://localhost:5173'` is reasonable for dev but there's no environment-based config for production.

7. **No request validation middleware** — Malformed POST bodies will throw unhandled errors or corrupt data.

8. **Sessions can grow unbounded** — No archiving, no deletion, no pagination on `POST /sessions`.

9. **No `learnerName` isolation** — All "Guest learner" sessions are indistinguishable. No multi-learner support.

10. **`conceptRules` keyword matching is brittle** — Simple substring matching. "calculate" in "recalculate" matches. No stemming, no fuzzy matching.

---

## 10. Opportunities for Long-Term Educational Research

These are areas where the project could grow in ways that serve both the product and the research mission:

### 10.1 Prompt Dataset Infrastructure
The `evaluatePrompt()` function scores prompts but discards them. Capturing every submitted `(scenario, reasoning, promptText, score, feedback)` tuple creates a fine-tuning dataset for V2's prompt grading model. This is the single most valuable research asset the app produces.

**Action:** Add a `prompts` collection in `db.json`, a `POST /api/prompts` endpoint, and a prompt export endpoint.

### 10.2 Misconception Taxonomy
`detectMisconceptions()` currently catches two patterns ("always/never" + short reasoning). A richer, research-grade misconception detector would benefit from a structured taxonomy — e.g., a JSON file of misconception patterns linked to Python concepts, with severity and suggested interventions. This would directly serve V1's "Misconception Dataset."

**Action:** Create `server/src/data/misconceptions.json` as a structured taxonomy; expand `detectMisconceptions()` to use it.

### 10.3 Scenario Effectiveness Tracking
Each scenario has an `effectivenessScore` (pre-seeded, static). Real learning data should inform this. After sessions, the system could track pass-rate on abstraction mapping for each scenario, and surface low-effectiveness scenarios for revision.

**Action:** Add a `stats` field to scenarios in `db.json` tracking completion rates, average abstraction match rate, average prompt score.

### 10.4 Learner Model (Lightweight)
No learner model exists. A simple model tracking: concepts attempted, concepts mastered (based on prompt score threshold), misconceptions detected, sessions completed — would enable basic adaptive recommendations (V3's "Adaptive Learning Engine") without needing a full ML pipeline.

**Action:** Extend session records to include a computed `learnerProfile` snapshot; add `GET /api/learners/:id` with profile data.

### 10.5 Scenario Authoring Tool
The 30 seed scenarios are high-quality, but expanding the corpus requires a UI. A scenario editor (title, difficulty, concepts, context, prompt, objectives, sampleReasoning, effectivenessScore) would allow educators without coding experience to contribute.

**Action:** Add a `POST /scenarios` editor panel in the frontend with form validation.

### 10.6 Structured Logging for Learning Research
All HTTP requests are logged via morgan, but learning interactions (what scenario, what reasoning, what abstraction map, what score) are not logged in a research-friendly format. A JSONL log file of learning events would enable offline analysis.

**Action:** Add a `server/src/services/eventLog.js` that appends structured learning events to `server/src/data/events.jsonl`.

### 10.7 Separation of Educational Philosophy from Implementation
The pedagogical approach (reasoning-first, abstraction mapping, prompt quality feedback) is evident in the code but nowhere documented as educational philosophy. A `docs/PEDAGOGY.md` explaining the why behind each design decision would be valuable for research publication and for onboarding contributors.

---

## 11. Summary

PyBe is a well-structured V0 prototype with a clear pedagogical vision and a clean MERN-style architecture (with JSON file storage instead of a database). The learning engine is a credible stub that can be replaced with real AI later.

**Strengths:**
- Clean separation of concerns: store, routes, service, client
- Good seed data with realistic, contextual scenarios
- Clear V0–V3 roadmap
- Thoughtful CSS design
- Accessible without any API keys or cloud services

**Key weaknesses:**
- No tests, no validation, no error boundaries
- Single-file frontend, no component separation
- `generateCode()` is template-based, not context-aware
- No AI integration points (V2/V3 are stubs)
- No auth, no learner identity, no multi-user support
- Documentation is minimal beyond README

**My recommendation:** Before adding new features, establish a test suite and consider extracting the frontend into separate component files. The most valuable near-term addition for the research mission is a **prompt dataset pipeline** — capturing every learner prompt with its score and context creates the foundation for V2's prompt grading model.

---

*Report generated by PyBe Assistant 🐍 — awaiting approval before any modifications.*