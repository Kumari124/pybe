# Contributing to PyBe

## Purpose

This document is the single source of truth for how to set up a development environment, the standards code must meet, the branch model, and what "ready for review" means for a pull request.

> **Read this before writing any code.** If you have a question that isn't answered here, open an issue — that's a sign the docs need updating.

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Kumari124/pybe.git
cd pybe

# 2. Install all dependencies
npm run installAll

# 3. Configure environment
cp server/.env.example server/.env
# Default values work for local development.

# 4. Seed sample data (30 scenarios)
npm run seed

# 5. Run the app
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:5000/api
```

**Prerequisites:** Node.js 18+

---

## Repository Structure

```
pybe/
├── client/           ← React + Vite frontend
├── server/           ← Express API
│   └── src/
│       ├── data/     ← JSON data and storage
│       ├── routes/   ← Express route handlers
│       └── services/ ← learningEngine.js (AI mentor logic)
├── docs/             ← Project documentation (Phase 1)
└── docs/pedagogy/    ← Phase 2 educational research docs
└── docs/research/    ← Phase 2–3 research docs
```

---

## Branch Model

```
main                  ← production-ready code only
ai/pybe-mvc          ← current feature branch (active development)
```

**Working on a new feature or fix:**
1. Create a branch from `main`: `git checkout -b feat/your-feature-name`
2. Work on the branch; commit early and often
3. Open a PR against `main` when ready for review

**Branch naming conventions:**
- `feat/` — new features (e.g., `feat/scenario-editor`)
- `fix/` — bug fixes (e.g., `fix/session-pagination`)
- `docs/` — documentation only (e.g., `docs/api-reference`)
- `refactor/` — code restructuring without behavior change
- `test/` — adding or fixing tests

---

## Code Standards

### JavaScript

- **No semicolons** — The project uses semicolon-free style. Use the linter to check.
- **No unused variables** — Every declared variable must be used.
- **Descriptive names** — `mapReasoning` not `map`, `abstractionMap` not `am`.
- **No `console.log`** in server routes or services — use the existing `morgan` logging. Exception: `seed.js` which runs as a script.

### React (client/src/main.jsx)

- Component names: PascalCase (e.g., `Result`, `Analytics`)
- Event handlers: `handleSubmit`, `handleChange`, `refresh` (no `onX` prefixes for props unless passing through)
- State: one `useState` per logical concern; no collapsing unrelated state into one object

### CSS (client/src/styles.css)

- CSS variables for all colors, spacing, and typography tokens
- No inline styles except dynamic values
- Mobile-first: base styles are mobile, `@media (max-width: ...)` adds desktop overrides

### Learning Engine (server/src/services/learningEngine.js)

- Each function does exactly one thing
- Keyword matching rules are additive — adding a new concept pattern requires adding one new rule object to `conceptRules`
- **Do not change the return shape of any exported function** without an ADR (Phase 3) — the frontend depends on these shapes

---

## File Organization

### What goes where

| Type | Location | Reason |
|---|---|---|
| New React components | `client/src/main.jsx` | Currently a single file; see ADR for proposed split (Phase 3) |
| New route handlers | `server/src/routes/` | One file per resource (scenarios, sessions, etc.) |
| New backend utilities | `server/src/services/` | Shared logic used by routes |
| Data models | `server/src/data/` | Storage, schemas, seed data |
| Documentation | `docs/` | All project docs, not inline in code |

### When to create a new file vs. edit an existing one

- **Creating a new route file** — requires a new Express route mount in `server/src/index.js`. Update the index when adding the mount.
- **Adding to `learningEngine.js`** — add a new rule object or export a new function. Don't modify the existing function signatures.
- **Adding to `store.js`** — add a new CRUD function following the existing pattern.

---

## Pull Request Process

### Before opening a PR

1. **Run the app** — `npm run dev`, verify the feature works end-to-end
2. **Read the relevant docs** — if you're changing `learningEngine.js`, read [LEARNING_ENGINE](./LEARNING_ENGINE.md)
3. **Check the [ROADMAP](./ROADMAP.md)** — confirm your change is consistent with the current phase
4. **No new TODO comments** — if you find something incomplete, open an issue instead of leaving a TODO

### PR description must include

- **What changed** — one paragraph
- **Why it changed** — one paragraph (or "fixes #issue-number")
- **How to test** — steps to verify the change works
- **Docs updated** — list any docs that were added or updated as a result

### PR will be closed without review if

- Tests are broken or missing (when a test suite exists)
- Any console.error or unhandled promise rejection fires during normal use
- The feature cannot be tested without an API key or external service the project doesn't already use
- No PR description is provided

---

## Scenario Contribution Process

PyBe's scenarios are the core educational content. Before submitting a scenario PR, read [CASE_STUDIES](./CASE_STUDIES.md) to understand how a good scenario flows, then apply these rules:

**Scenario quality checklist:**
- [ ] Context is a real-world situation, not a programming problem
- [ ] Prompt asks for reasoning, not code
- [ ] At least one objective connects to a Python concept
- [ ] Difficulty level matches the concept complexity (see [ROADMAP](./ROADMAP.md) V0 tier definitions)
- [ ] No solution is embedded in the prompt
- [ ] Sample reasoning exists and demonstrates the target concept

> **Important:** Scenario PRs for Phase 1 should be limited to bug fixes (e.g., incorrect concept tags, broken prompt wording). New scenario development follows the Scenario Design Guide process defined in Phase 2.

---

## Reporting Issues

Before opening an issue:
- Check if a similar issue already exists
- Confirm it reproduces with the latest seed data (`npm run seed`)

For bug reports, include: steps to reproduce, expected behavior, actual behavior, Node.js version.

---

## Relationship to Other Phase 1 Documents

- [CONTRIBUTING](./CONTRIBUTING.md) ← you are here
- [VISION](./VISION.md) ← defines what "good contribution" means for this project
- [ROADMAP](./ROADMAP.md) ← tells you what phase the project is in and what can be worked on
- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← required reading before modifying the AI mentor logic
- [API](./API.md) ← required reading before adding new endpoints
- [CASE_STUDIES](./CASE_STUDIES.md) ← shows the app in action, helps you understand what to preserve when changing code