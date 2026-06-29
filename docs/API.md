# API Reference

## Purpose

Complete reference for all backend API endpoints. Includes request parameters, request bodies, response shapes, and error handling.

All endpoints are prefixed with `/api`. Base URL: `http://localhost:5000/api` (or `VITE_API_URL` if configured).

---

## Health

### `GET /api/health`

Returns server status.

**Response `200 OK`**
```json
{ "ok": true, "product": "PyBe" }
```

---

## Scenarios

### `GET /api/scenarios`

Returns all scenarios, optionally filtered and sorted by effectiveness score.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Full-text search: matches `title`, `context`, and `concepts` |
| `concept` | string | Exact match on `concepts` array |
| `difficulty` | string | One of: `Beginner`, `Explorer`, `Builder` |

**Response `200 OK`** — array of scenario objects (see [Scenario object](#scenario-object))

**Example:** `GET /api/scenarios?difficulty=Beginner&concept=loops`

---

### `GET /api/scenarios/:id`

Returns a single scenario by its UUID.

**Response `200 OK`** — scenario object
**Response `404 Not Found`** — `{ "message": "Scenario not found" }`

---

### `POST /api/scenarios`

Creates a new scenario. Primarily for the scenario editor (future feature); currently used by the seed script.

**Request body**
```json
{
  "title": "string (required)",
  "difficulty": "string (required) — Beginner | Explorer | Builder",
  "concepts": ["string"] (required) — array of concept names",
  "context": "string (required)",
  "prompt": "string (required)",
  "objectives": ["string"] (required)",
  "sampleReasoning": "string (optional)",
  "effectivenessScore": "number (optional, 0–100)"
}
```

**Response `201 Created`** — created scenario object
**Response `500 Server Error`** — `{ "message": "Server error" }`

---

## Sessions

### `GET /api/sessions`

Returns the 30 most recent sessions, each with its scenario object joined in.

**Response `200 OK`** — array of session objects (see [Session object](#session-object))

---

### `POST /api/sessions`

Submits a learning session. This is the primary interaction: the learner provides reasoning and prompt, and the system returns the AI mentor output.

**Request body**
```json
{
  "learnerName": "string (optional, default: 'Guest learner')",
  "scenarioId": "string (required) — UUID of the scenario",
  "reasoning": "string (required) — learner's plain-language reasoning",
  "promptText": "string (optional) — the prompt the learner would give an AI mentor",
  "reflection": "string (optional) — learner's self-reflection"
}
```

**Response `201 Created`** — session object (full AI mentor output included)
```json
{
  "_id": "uuid",
  "learnerName": "Guest learner",
  "scenario": { /* scenario object */ },
  "reasoning": "I would check if it is raining...",
  "promptText": "Explain my approach step by step...",
  "reflection": "I noticed I wasn't specific about...",
  "abstractionMap": [
    {
      "pattern": "Decision making",
      "pythonConcept": "if / elif / else",
      "explanation": "You are branching based on a condition..."
    }
  ],
  "generatedCode": "temperature = 32\nif temperature > 30:\n    print('Take action')",
  "codeExplanation": "The code starts from your natural reasoning...",
  "promptScore": 65,
  "promptFeedback": ["Add more context about the situation..."],
  "misconceptions": [],
  "masterySignals": ["Recognized decision making", "Prompt maturity is developing"],
  "createdAt": "2026-06-23T13:02:13.476Z",
  "updatedAt": "2026-06-23T13:02:13.476Z"
}
```

**Response `404 Not Found`** — `{ "message": "Scenario not found" }`
**Response `500 Server Error`** — `{ "message": "Server error" }`

---

## Analytics

### `GET /api/analytics`

Returns aggregated learning data for the dashboard. Intended to be polled after each session refresh.

**Response `200 OK`**
```json
{
  "scenarioCount": 30,
  "sessionCount": 12,
  "averagePromptScore": 58,
  "conceptCounts": {
    "for / while loops": 5,
    "if / elif / else": 8,
    "lists and dictionaries": 3
  },
  "misconceptionCounts": {
    "Watch for absolute rules...": 2
  }
}
```

All counts are computed from every session in `db.json`. If no sessions exist, `sessionCount` and `averagePromptScore` are `0` and `conceptCounts` / `misconceptionCounts` are empty objects.

---

## Roadmap

### `GET /api/roadmap`

Returns the V0–V3 roadmap phases.

**Response `200 OK`** — array of phase objects
```json
[
  {
    "phase": "V0",
    "title": "Core Learning Experience",
    "summary": "Scenario interface, abstraction mapping...",
    "items": ["Scenario Interface", "AI Abstraction Mapper", ...]
  }
]
```

---

## Object Schemas

### Scenario object

| Field | Type | Description |
|---|---|---|
| `_id` | string (UUID) | Unique identifier |
| `title` | string | Scenario title |
| `difficulty` | string | `Beginner` \| `Explorer` \| `Builder` |
| `concepts` | string[] | Python concepts this scenario teaches |
| `context` | string | Real-world situation description |
| `prompt` | string | The guided question shown in the reasoning form |
| `objectives` | string[] | Learning objectives |
| `sampleReasoning` | string | Example learner reasoning (seed data only) |
| `effectivenessScore` | number | Pre-seeded quality score (0–100) |
| `createdAt` | string (ISO 8601) | Creation timestamp |
| `updatedAt` | string (ISO 8601) | Last update timestamp |

### Session object

| Field | Type | Description |
|---|---|---|
| `_id` | string (UUID) | Unique identifier |
| `learnerName` | string | Name of the learner (default: "Guest learner") |
| `scenario` | object \| null | Joined scenario object, or null if scenario was deleted |
| `reasoning` | string | Learner's reasoning text |
| `promptText` | string | Learner's AI mentor prompt |
| `reflection` | string | Learner's self-reflection |
| `abstractionMap` | object[] | Mapped reasoning patterns (see [LEARNING_ENGINE](./LEARNING_ENGINE.md)) |
| `generatedCode` | string | Python code generated from the abstraction map |
| `codeExplanation` | string | Natural language explanation of the code |
| `promptScore` | number | Prompt maturity score (0–100) |
| `promptFeedback` | string[] | Specific feedback on the learner's prompt |
| `misconceptions` | string[] | Detected misconceptions |
| `masterySignals` | string[] | Signals about the learner's demonstrated understanding |
| `createdAt` | string (ISO 8601) | Session timestamp |
| `updatedAt` | string (ISO 8601) | Last update timestamp |

---

## Relationship to Other Phase 1 Documents

- [API](./API.md) ← you are here
- [ARCHITECTURE](./ARCHITECTURE.md) ← describes how the routes and data layer fit together
- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← defines the schema of `abstractionMap`, `promptScore`, `misconceptions`, and `masterySignals`
- [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) ← describes the end-to-end request/response cycle in narrative form