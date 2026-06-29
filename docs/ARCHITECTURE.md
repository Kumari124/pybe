# Architecture

## Purpose

Describes the high-level system design, module responsibilities, data flow, and the reasoning behind key structural choices.

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  React 18 + Vite · Plain CSS · lucide-react             │
│  Single-page app · No React Router                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / JSON
                       │ VITE_API_URL (default: http://localhost:5000/api)
┌──────────────────────▼──────────────────────────────────┐
│                     SERVER (Node.js)                     │
│  Express 4 · JSON file storage · No ORM                  │
│                                                          │
│  routes/                                                 │
│    scenarios.js   → GET/POST /api/scenarios              │
│    sessions.js    → GET/POST /api/sessions               │
│    analytics.js   → GET  /api/analytics                  │
│    roadmap.js     → GET  /api/roadmap                    │
│                                                          │
│  services/                                               │
│    learningEngine.js  ← core AI mentor logic             │
│                                                          │
│  data/                                                  │
│    store.js      ← async CRUD over db.json               │
│    db.json       ← scenarios[] + sessions[]              │
│    roadmap.js    ← V0–V3 phase definitions               │
└─────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### Client

**`client/src/main.jsx`**

The entire frontend is one React component tree (~260 lines). Contains: `App`, `Result`, `EmptyResult`, `Analytics`, `Roadmap`, `SessionList`.

- **State:** All `useState` / `useEffect` in `App`. No context, no store.
- **API calls:** Single `api()` helper, base URL from `import.meta.env.VITE_API_URL`.
- **Styling:** `client/src/styles.css` — ~300 lines, custom CSS with CSS variables, CSS Grid, Flexbox.
- **Icons:** `lucide-react`.

### Server

**`server/src/index.js`**

Express app setup. Middleware: `cors`, `express.json`, `morgan('dev')`. Mounts four route files. Global error handler.

**`server/src/routes/sessions.js`**

The most important route. On `POST`:
1. Fetches scenario by ID from `store`
2. Runs `learningEngine` functions in sequence: `mapReasoning`, `generateCode`, `evaluatePrompt`, `detectMisconceptions`, `masterySignals`
3. Calls `store.addSession` with the full result object
4. Returns the session including the AI mentor output

**`server/src/routes/scenarios.js`**

`GET /` with optional `q`, `concept`, `difficulty` filters → `store.listScenarios`.
`GET /:id` → `store.getScenario`.
`POST /` → `store.addScenario`.

**`server/src/routes/analytics.js`**

Aggregates session data: scenario count, session count, average prompt score, concept counts, misconception counts. Returns a dashboard-ready object.

**`server/src/routes/roadmap.js`**

Returns the static V0–V3 roadmap array. No database access.

### Services

**`server/src/services/learningEngine.js`**

Core AI mentor logic. Six exported functions:

| Function | Input | Output |
|---|---|---|
| `mapReasoning` | learner reasoning text | array of concept rule matches |
| `generateCode` | scenario object + abstraction map | Python code string |
| `explainCode` | abstraction map | natural language explanation |
| `evaluatePrompt` | learner prompt text | score + feedback array |
| `detectMisconceptions` | learner reasoning text | array of misconception strings |
| `masterySignals` | abstraction map + prompt score | array of mastery signal strings |

### Data Layer

**`server/src/data/store.js`**

Thin async CRUD wrapper over `db.json`. All reads/writes use `fs/promises`. Every record gets `_id` (UUID v4), `createdAt`, `updatedAt`.

**`server/src/data/db.json`**

The live data store. Two top-level arrays: `scenarios[]` and `sessions[]`. Seeded with 30 scenarios; sessions start empty.

**`server/src/data/roadmap.js`**

Static V0–V3 phase definitions. Not stored in db.json — served directly from this module.

---

## Data Flow: A Learning Session

```
Learner types reasoning
        │
        ▼
POST /api/sessions { scenarioId, reasoning, promptText, reflection }
        │
        ▼
sessions.js route handler
        │
        ├─ store.getScenario(id)          → scenario object
        │
        ├─ learningEngine.mapReasoning()  → abstractionMap[]
        ├─ learningEngine.generateCode()  → generatedCode string
        ├─ learningEngine.explainCode()   → codeExplanation string
        ├─ learningEngine.evaluatePrompt()→ { score, feedback[] }
        ├─ learningEngine.detectMisconceptions() → misconceptions[]
        └─ learningEngine.masterySignals()→ masterySignals[]
        │
        ▼
store.addSession(fullResultObject)
        │
        ▼
Returns session object to client
        │
        ▼
Result component renders AI Mentor Output
```

---

## Design Decisions

### Why JSON file storage?

- Zero infrastructure. Runs anywhere Node.js runs.
- Deterministic. Easy to seed, reset, and version-control.
- Sufficient for V0–V1 prototype scale.
- See [ADR: JSON File Storage](./ADR/0001-json-file-storage.md) (Phase 3).

### Why single-file frontend?

- Fast to write and iterate for a prototype.
- No build configuration complexity.
- See [ADR: Single-File React](./ADR/0003-single-file-react.md) (Phase 3).

### Why rule-based AI instead of a real LLM?

- No API keys, no external dependency, fully offline.
- Deterministic output enables reliable testing.
- The educational model can be validated before adding LLM variability.
- See [ADR: Deterministic AI Stub](./ADR/0002-deterministic-ai-stub.md) (Phase 3).

---

## Environment Variables

**Server (`server/.env`)**

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allowed origin |

**Client (`client/.env`)**

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `client/src/main.jsx` | Entire React frontend |
| `client/src/styles.css` | All CSS |
| `server/src/index.js` | Express app entry point |
| `server/src/routes/sessions.js` | Session creation + learning engine orchestration |
| `server/src/routes/scenarios.js` | Scenario CRUD |
| `server/src/routes/analytics.js` | Dashboard data aggregation |
| `server/src/data/store.js` | JSON file CRUD |
| `server/src/data/db.json` | Live data |
| `server/src/data/roadmap.js` | V0–V3 definitions |
| `server/src/services/learningEngine.js` | AI mentor logic |
| `server/src/seed.js` | Seeds 30 scenarios |

---

## Relationship to Other Phase 1 Documents

- [ARCHITECTURE](./ARCHITECTURE.md) ← you are here
- [API](./API.md) ← endpoint specs for the routes described here
- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← deep-dive on the AI mentor service
- [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) ← the session data flow in narrative form
- [CASE_STUDIES](./CASE_STUDIES.md) ← concrete examples of this architecture in use
- [VISION](./VISION.md) ← the "why" behind this system design