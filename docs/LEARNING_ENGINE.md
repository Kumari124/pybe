# Learning Engine

## Purpose

Complete reference for every function in `server/src/services/learningEngine.js`. Explains what each function does, how it works, what it returns, and how to extend it. This is the document to read before modifying any AI mentor logic.

---

## Overview

The learning engine is the AI mentor's brain. It is a **rule-based, deterministic system** — given the same inputs, it always produces the same outputs. This is intentional: it makes the system testable, offline-capable, and auditable.

It consists of six exported functions:

| Function | Role |
|---|---|
| `mapReasoning(reasoning)` | Maps natural-language reasoning to Python concept patterns |
| `generateCode(scenario, maps)` | Generates Python code from the abstraction map |
| `explainCode(maps)` | Produces a natural-language explanation of the generated code |
| `evaluatePrompt(promptText)` | Scores and gives feedback on the learner's AI mentor prompt |
| `detectMisconceptions(reasoning)` | Detects common reasoning errors or imprecisions |
| `masterySignals(maps, promptScore)` | Generates human-readable signals about demonstrated understanding |

These functions are called in sequence by `POST /api/sessions` (see [API](./API.md) and [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md)).

---

## Concept Rules — The Foundation

All six functions are grounded in `conceptRules`, an array of six rule objects:

```js
{
  keywords: ['repeat', 'again', 'each', ...],
  pattern: 'Repetition',
  pythonConcept: 'for / while loops',
  explanation: 'Your reasoning repeats an action...'
}
```

Each rule maps **natural language patterns in learner reasoning** → **abstract reasoning pattern** → **Python construct**. This is the core pedagogical idea: the learner's words reveal the structure of their thinking, which maps to a Python structure.

### Current Concept Rules

| Pattern | Python Concept | Key Indicators |
|---|---|---|
| Repetition | `for / while loops` | repeat, again, each, every, loop |
| Decision making | `if / elif / else` | if, when, unless, decide, choose, condition |
| Collection handling | `lists and dictionaries` | list, items, collection, group, many |
| Computation | `variables and arithmetic expressions` | calculate, total, average, sum, score, cost |
| Reusable procedure | `functions` | step, process, recipe, function, reuse |
| Selection and filtering | `comparisons and list comprehensions` | compare, match, filter, find, search |

If no keywords match, a default rule applies:
```js
{
  pattern: 'Sequential thinking',
  pythonConcept: 'statements and variables',
  explanation: 'You described a step-by-step solution...'
}
```

---

## `mapReasoning(reasoning)`

### What it does

Takes the learner's free-text reasoning and returns an array of matched concept rules.

### Algorithm

1. Lowercase the reasoning text
2. For each rule in `conceptRules`, check if any keyword appears in the lowercased text
3. Return all matching rules; if none match, return the default sequential-thinking rule

### Returns

```js
[
  {
    pattern: 'Decision making',
    pythonConcept: 'if / elif / else',
    explanation: 'You are branching based on a condition...'
  }
]
```

### Keyword matching is naive

`/loop/` matches "reloop" and "loops" but not "looping" (no stemming). This is a known limitation documented in [PROJECT_ANALYSIS](./PROJECT_ANALYSIS.md).

### How to add a new concept rule

1. Add a new rule object to the `conceptRules` array with `keywords`, `pattern`, `pythonConcept`, and `explanation`.
2. Update `generateCode()` to handle the new `pythonConcept` in its branching logic.
3. No need to modify `mapReasoning` itself — it iterates all rules automatically.

---

## `generateCode(scenario, maps)`

### What it does

Takes the scenario object and the abstraction map (from `mapReasoning`) and returns a Python code string.

### Algorithm

Template-based code generation. Checks which Python concepts are present in the abstraction map and selects from hardcoded templates:

| Condition | Template |
|---|---|
| `loop` + `condition` in concepts | Loop + if (threshold filter) |
| `function` in concepts | Function + loop + return |
| `loop` in concepts | List iteration with print |
| `condition` in concepts | If/else with threshold |
| Default | Scenario title + reasoning comment |

### Returns

```python
temperature = 32

if temperature > 30:
    print("Take action now")
else:
    print("Keep observing")
```

### Important limitation

**The generated code does not incorporate scenario-specific data.** The scenario's `title`, `context`, and `objectives` are not used except in the default branch (which uses `title`). All code templates are generic. This means the "Bag Weight Label" scenario and the "Temperature Message" scenario will generate very similar code even though their contexts differ.

This is documented in [PROJECT_ANALYSIS](./PROJECT_ANALYSIS.md) as a key gap. Fixing this is not a Phase 1 change.

### How to extend the code generator

Add a new `if` branch in the function. Check for the presence of the new `pythonConcept` string. Return the appropriate template string.

---

## `explainCode(maps)`

### What it does

Takes the abstraction map and produces a single natural-language sentence explaining the Python concepts that resulted from the learner's reasoning.

### Returns

```
"The code starts from your natural reasoning and turns it into Python structure: Decision making becomes if / elif / else; Selection and filtering becomes comparisons and list comprehensions."
```

---

## `evaluatePrompt(promptText)`

### What it does

Scores the learner's prompt (the text they would give an AI mentor) on maturity, and returns specific feedback.

### Scoring rubric

| Criterion | Points | Check |
|---|---|---|
| Length | +15 | `promptText.length > 40` |
| Reasoning verbs | +20 | `/step\|explain\|why\|reason/i` in text |
| Example/data terms | +15 | `/example\|input\|output\|data/i` in text |
| Python terms | +15 | `/python\|loop\|if\|list\|function/i` in text |
| **Maximum score** | **100** | — |

Baseline score: 35 (even an empty prompt scores 35).

### Returns

```js
{
  score: 65,
  feedback: [
    'Add more context about the situation and expected output.',
    'Name the Python concept you think may apply.'
  ]
}
```

If no feedback applies (strong prompt), the feedback array contains one positive message.

### What "prompt maturity" means

A mature prompt to an AI mentor:
1. Is specific enough to produce a useful response (length + context)
2. Asks for explanation, not just code (`why` / `reason`)
3. Gives an example or specifies expected input/output
4. Names the Python concept they're working with

---

## `detectMisconceptions(reasoning)`

### What it does

Scans the learner's reasoning for signals of common misconceptions.

### Current rules

| Rule | Detects | Feedback |
|---|---|---|
| Absolute language | `/always\|never/i` in reasoning | "Watch for absolute rules. Programming logic often needs explicit edge cases." |
| Under-specification | `reasoning.length < 60` | "Reasoning is brief. Try naming the inputs, decision rule, and expected result." |

### Returns

```js
['Watch for absolute rules. Programming logic often needs explicit edge cases.']
```

Empty array if no misconceptions detected.

### How to extend misconception detection

Add a new `if` condition checking for the misconception pattern. Return a specific feedback string. Add it to the returned array.

---

## `masterySignals(maps, promptScore)`

### What it does

Generates human-readable positive signals about what the learner demonstrated understanding of, based on their abstraction map and prompt score.

### Logic

- One signal per matched concept pattern: `"Recognized ${pattern.toLowerCase()}"`
- If `promptScore >= 70`: add `"Prompt maturity is developing"`

### Returns

```js
['Recognized decision making', 'Recognized computation', 'Prompt maturity is developing']
```

---

## How the Functions Connect

```
Learner reasoning
      │
      ▼
mapReasoning(reasoning)          → abstractionMap[]
      │
      ▼
generateCode(scenario, maps)     → generatedCode (string)
      │
      ▼
explainCode(maps)               → codeExplanation (string)
      │
      ▼
evaluatePrompt(promptText)      → { score, feedback[] }
      │
      ▼
detectMisconceptions(reasoning) → misconceptions[]
      │
      ▼
masterySignals(maps, score)     → masterySignals[]
```

All six results are assembled into a session object by `POST /api/sessions` (see [API](./API.md)).

---

## Testing the Learning Engine

> TODO: Add test suite for learningEngine.js
> Tracking issue: (add issue number here)

The deterministic nature of the learning engine makes it straightforward to test:
- `mapReasoning` — pass reasoning strings and assert expected concept matches
- `evaluatePrompt` — pass prompt strings and assert expected score ranges
- `detectMisconceptions` — pass reasoning with and without absolute language, assert expected output
- `generateCode` — pass scenarios with different concept sets, assert code template used
- `masterySignals` — pass maps and scores, assert expected signals

---

## Relationship to Other Phase 1 Documents

- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← you are here
- [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) ← traces through all six functions in the context of a learner session
- [API](./API.md) ← defines the request/response shapes that use these function outputs
- [ARCHITECTURE](./ARCHITECTURE.md) ← describes where this module fits in the server
- [VISION](./VISION.md) ← explains the pedagogical philosophy behind the abstraction mapping approach