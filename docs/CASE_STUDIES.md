# Case Studies

## Purpose

Three concrete walkthroughs showing PyBe in action. Each case study traces a complete interaction from the learner's perspective, the API calls made, and the AI Mentor Output returned. These are the documents to read before writing code, reviewing a PR, or explaining the project to someone new.

---

## Case Study 1 — A First-Time Learner

### Who

**Ananya, age 14.** First time using PyBe. Has been learning Python for two weeks in school. Knows what a variable is but doesn't yet think in terms of "I'm creating a variable."

### Scenario

She opens the app, sees the sidebar full of scenario cards, and selects **"Bag Weight Label"** (Beginner / variables).

### What she reads

```
[Context]
A student has one school bag with a weight written on a scale.

[Prompt]
What single piece of information would you store so the computer can
remember the bag weight?

[Objectives]
• Identify one value
• Give the value a name
• Connect naming to a variable
```

### What she types in the Reasoning field

> "I would read the number on the scale and I would remember it as bag weight."

She leaves the Prompt and Reflection fields empty and clicks **"Map My Reasoning."**

### API call

```
POST /api/sessions
{
  "learnerName": "Guest learner",
  "scenarioId": "309e024b-4e4e-4654-9ac5-8d66d70c6a9f",
  "reasoning": "I would read the number on the scale and I would remember it as bag weight.",
  "promptText": "",
  "reflection": ""
}
```

### What happens on the server

- `mapReasoning` — No keywords match (no "repeat", "if", "list", "calculate", "step", "compare"). Default rule applies: **Sequential thinking → statements and variables**.
- `generateCode` — Default branch: generic Python with scenario title.
- `evaluatePrompt` — Empty prompt text → score **35**, 4 feedback items.
- `detectMisconceptions` — Reasoning length ~85 chars, no absolute language → no misconceptions detected.
- `masterySignals` — One signal: "Recognized sequential thinking."

### AI Mentor Output Ananya sees

```
Prompt maturity: 35

Abstraction Mapping:
  Sequential thinking → statements and variables
  "You described a step-by-step solution. Python starts by
   representing those steps as statements."

Generated Python:
  scenario = "Bag Weight Label"
  reasoning = "Break the situation into clear steps"
  print(scenario)
  print(reasoning)

Feedback:
  ✗ Add more context about the situation and expected output.
  ✗ Ask the AI to explain its reasoning, not just produce code.
  ✗ Include an example input or output to make the prompt testable.
  ✗ Name the Python concept you think may apply.

Misconceptions: (none)
Mastery: Recognized sequential thinking
```

### What Ananya learns

1. Her reasoning mapped to "Sequential thinking" — not yet to "variables," which is what the scenario is designed to teach.
2. Her prompt scored 35 (baseline) because she left it empty — she now sees four specific things to improve.
3. The generated code is generic — not specific to bag weights. She might wonder: where is the actual number?

**This is a useful outcome.** The AI Mentor Output shows Ananya that:
- Reasoning and naming matter
- Prompt quality is a skill she can improve
- The system sees her thinking as "sequential" — and the next step is to connect that to "I am storing a value in a named container"

---

## Case Study 2 — An Educator Reviews Class Data

### Who

**Mr. Patel, a computer science teacher.** His class of 18 students each completed 3 PyBe sessions as a homework exercise. He's reviewing the class data the next morning.

### What he does

He opens PyBe and looks at the **Learner Analytics** panel:

```
Concept Mastery:
  if / elif / else        ████████████  18
  for / while loops       ██████████    15
  lists and dictionaries  ██████         9
  variables and arithmetic ████           6

Average Prompt Score: 52

Session Count: 54
```

He notices:
- Most students engaged with conditionals and loops, but concept counts for collections are low.
- The average prompt score of 52 is below the "developing" threshold of 70.
- 54 sessions means some students completed more than 3 — positive engagement signal.

### What he wants to know but can't see yet (Phase 2)

> "Which specific scenario produced the most misconceptions about loops?"
> "Which student's prompt scores improved from session 1 to session 3?"
> "Which scenarios had the lowest abstraction map match rate?"

These are Phase 2 and Phase 3 capabilities: per-learner profiles, misconception tracking per scenario, and prompt score progression.

### What he does today

He identifies that his class needs more practice with **lists and dictionaries** before moving to loops. He plans to:
1. Ask students who completed the "Favorite Color List" scenario to also complete "Attendance Count"
2. Give a mini-lecture on list operations before the next class
3. Encourage students to fill in the prompt field, not just reasoning

---

## Case Study 3 — A Developer Replaces the Learning Engine

### Who

**Ravi, a developer.** He's been hired to implement V2: replacing the rule-based AI stub with a real LLM integration. He starts by reading the Phase 1 documentation.

### What he reads

1. [LEARNING_ENGINE](./LEARNING_ENGINE.md) — Understands the six-function contract: what each function takes, what it returns, what it is expected to do.
2. [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) — Understands how the functions are called in sequence during a session.
3. [API](./API.md) — Sees the exact request/response shapes that the frontend expects.
4. [ARCHITECTURE](./ARCHITECTURE.md) — Understands that `server/src/services/learningEngine.js` is the integration point.

### What he wants to verify before starting

> "Does the existing system handle latency? What happens if the LLM call fails?"

He reads `routes/sessions.js` and finds:
```js
router.post('/', async (req, res, next) => {
  try {
    const scenario = await store.getScenario(req.body.scenarioId);
    if (!scenario) return res.status(404).json({ message: 'Scenario not found' });

    const abstractionMap = engine.mapReasoning(req.body.reasoning);
    const generatedCode = engine.generateCode(scenario, abstractionMap);
    // ...
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});
```

He notes: **no timeout on the LLM call** (because there is no LLM call yet). The error handler passes errors to Express's global error handler, which returns a 500. There is no retry logic, no circuit breaker, no fallback to the rule-based system.

**This is a known gap** — he notes it and adds timeout handling and fallback to his V2 scope.

### What he needs to build

He decides to create `server/src/services/llmEngine.js` that implements the same six-function interface as `learningEngine.js`:

```js
// llmEngine.js — same exports as learningEngine.js
module.exports = {
  mapReasoning,
  generateCode,
  explainCode,
  evaluatePrompt,
  detectMisconceptions,
  masterySignals
};
```

Then update `routes/sessions.js` to accept either engine:

```js
const engine = process.env.AI_ENGINE === 'llm'
  ? require('./services/llmEngine')
  : require('./services/learningEngine');
```

Before opening a PR, he checks:
- [CONTRIBUTING](./CONTRIBUTING.md) — branch naming (`feat/llm-integration`), code standards
- [ROADMAP](./ROADMAP.md) — confirms V2 AI integration is the right phase for this work

### What he documents in his PR

- The interface contract his new engine satisfies
- How to set `AI_ENGINE=llm` in `server/.env`
- A test harness: a set of 10 `(reasoning, expectedConcept)` pairs that both engines should handle consistently, so the transition is verifiable

---

## Relationship to Other Phase 1 Documents

- [CASE_STUDIES](./CASE_STUDIES.md) ← you are here
- [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) ← Case Study 1 traces the engine functions in detail
- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← the six functions that power the sessions in Case Studies 1 and 3
- [API](./API.md) ← the request/response shapes shown in Case Studies 1 and 3
- [CONTRIBUTING](./CONTRIBUTING.md) ← the standards Ravi follows in Case Study 3
- [ROADMAP](./ROADMAP.md) ← the phases that contextualize what each case study can and cannot do