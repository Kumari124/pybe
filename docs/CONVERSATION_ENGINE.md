# Conversation Engine

## Purpose

Traces a complete learning session from the learner's first action to the AI Mentor Output they receive. Shows how the six learning engine functions connect, what the learner experiences at each step, and why each design choice serves the pedagogical vision.

This document is the **narrative companion** to [LEARNING_ENGINE](./LEARNING_ENGINE.md) (which explains the functions) and [API](./API.md) (which specifies the request/response shapes).

---

## The Interaction Model

PyBe's learning session is not a chat. It is a **structured mentor interaction** with three explicit inputs from the learner:

1. **Reasoning** — "How would you approach this situation in your own words?"
2. **Prompt** — "What would you say to an AI mentor to get help with this?"
3. **Reflection** — "What did you notice about your thinking?"

And one structured output from the system: **AI Mentor Output**.

This is not a free-form conversation. The structure is intentional — it makes the learner's reasoning visible and comparable across sessions.

---

## Step-by-Step: A Learning Session

### Step 1 — Learner selects a scenario

The learner browses scenarios using the sidebar filters (difficulty, concept, text search). They click a scenario card. The scenario's `context`, `prompt`, and `objectives` appear in the Learning Panel.

**What they see:**

```
[Context]
A student has one school bag with a weight written on a scale.

[Prompt shown in the reasoning textarea]
What single piece of information would you store so the computer
can remember the bag weight?

[Objectives]
• Identify one value
• Give the value a name
• Connect naming to a variable
```

**Why this format:** The `prompt` is the guided question shown as placeholder text in the reasoning textarea. The learner is not forced to read it — it's scaffolding that disappears once they start typing. This is intentional: it keeps the focus on the learner's own reasoning, not on following instructions.

---

### Step 2 — Learner enters reasoning

The learner types their reasoning in the first textarea. This is the most important input in the session. It is the learner's natural-language description of how they would solve the situation.

**Example input:**

> "I would look at the number on the scale and write it down as the bag weight. I would call it something like 'bag_weight' so I can remember what the number means."

**What happens next:** The learner clicks "Map My Reasoning." The form submits a `POST /api/sessions` request containing `{ scenarioId, reasoning, promptText, reflection, learnerName }`.

---

### Step 3 — The server processes the session

On the server, `routes/sessions.js` orchestrates the learning engine functions in sequence:

**3a. `mapReasoning(reasoning)`**

Learner reasoning: *"look at the number on the scale and write it down... call it something like..."*

Keywords matched: **"write it down"** → no match; **"call it"** → no match.

Result: No concept rules match. The default rule applies:

```js
{
  pattern: 'Sequential thinking',
  pythonConcept: 'statements and variables',
  explanation: 'You described a step-by-step solution...'
}
```

> **Note:** This scenario is designed to teach variables, but the learner's reasoning doesn't use loop/decision/collection keywords. `mapReasoning` returns the default. The generated code will use a variable, which is still correct — but the abstraction map will only show one entry.

**3b. `generateCode(scenario, abstractionMap)`**

The map contains only the default rule. `generateCode` falls to the default branch:

```python
scenario = "Bag Weight Label"
reasoning = "Break the situation into clear steps"
print(scenario)
print(reasoning)
```

> **Limitation:** The generated code is generic. It uses the scenario title as a string. It does not generate `bag_weight = 12.5` with a realistic weight value because `generateCode` has no access to scenario-specific data.

**3c. `explainCode(maps)`**

```
"The code starts from your natural reasoning and turns it into
Python structure: Sequential thinking becomes statements and variables."
```

**3d. `evaluatePrompt(promptText)`**

If the learner left the prompt textarea empty (they only typed reasoning), `promptText` is `""`:

```js
{
  score: 35,  // baseline only
  feedback: [
    'Add more context about the situation and expected output.',
    'Ask the AI to explain its reasoning, not just produce code.',
    'Include an example input or output to make the prompt testable.',
    'Name the Python concept you think may apply.'
  ]
}
```

**3e. `detectMisconceptions(reasoning)`**

Learner reasoning: no absolute language, length is ~100 characters.

```js
[]  // no misconceptions detected
```

**3f. `masterySignals(abstractionMap, promptScore)`**

```js
['Recognized sequential thinking']
// Note: "Prompt maturity is developing" NOT added — score is 35, below 70
```

---

### Step 4 — AI Mentor Output is displayed

The `Result` component in the React frontend receives the session object and renders the AI Mentor Output panel:

```
┌──────────────────────────────────────┐
│  35              Prompt maturity     │
├──────────────────────────────────────┤
│  ▸ Sequential thinking               │
│    statements and variables          │
│    You described a step-by-step...   │
├──────────────────────────────────────┤
│  Generated Python                    │
│  ▸ scenario = "Bag Weight Label"     │
│    reasoning = "Break..."            │
│    print(scenario)                   │
│                                      │
│  The code starts from your natural   │
│  reasoning and turns it into Python  │
│  structure: Sequential thinking...   │
├──────────────────────────────────────┤
│  ✗ Add more context about...         │
│  ✗ Ask the AI to explain its...      │
│  ✗ Include an example input...       │
│  ✗ Name the Python concept...        │
└──────────────────────────────────────┘
```

The learner can now see:
- What pattern their reasoning mapped to
- What Python concept that pattern corresponds to
- What code was generated (and that it doesn't yet fully capture the bag weight)
- How to improve their AI mentor prompt

---

### Step 5 — Learner optionally enters a prompt and reflection

The prompt and reflection fields are optional. The learner can:
- Fill in the prompt field and resubmit to see a revised score
- Fill in the reflection field to document metacognition

**Prompt resubmit flow:**

If the learner now fills in:

> "Explain my approach step by step using a Python variable to store the bag weight. Show an example."

`evaluatePrompt` scores this:

| Criterion | Match | Score |
|---|---|---|
| Length > 40 | yes | +15 |
| `step\|explain\|why\|reason` | yes ("step", "Explain", "using") | +20 |
| `example\|input\|output\|data` | yes ("example") | +15 |
| `python\|loop\|if\|list\|function` | yes ("variable", "Python") | +15 |
| **Total** | | **65** |

The AI Mentor Output refreshes with the new score and revised feedback.

---

## Why This Design Serves the Vision

### The three-field structure

Reasoning, Prompt, Reflection are separate fields, not one free-text box. This is a pedagogical choice:
- **Reasoning** is about *thinking*, not code. Keeping it separate from "how would you ask for help" forces the learner to separate problem-solving from communication.
- **Prompt quality** is a learning goal in itself. Scoring it separately makes it a visible, improvable skill.
- **Reflection** is the metacognitive step. Making it explicit — "what did you notice about your thinking?" — trains self-awareness that transfers to debugging and code review.

### The abstraction map as feedback, not correction

The AI Mentor Output does not say "you're wrong." It says "your reasoning maps to this pattern." The explanation is descriptive, not corrective. Misconceptions are surfaced as gentle flags, not failures.

### The score is about communication, not correctness

`promptScore` measures how well the learner can communicate with an AI mentor, not how correctly they reasoned about the scenario. This is important: a learner can reason perfectly and write a vague prompt, or reason imperfectly and write an excellent prompt. Both are real-world skills.

---

## Missing Pieces in the Current Implementation

> TODO: These are known limitations documented in [PROJECT_ANALYSIS](./PROJECT_ANALYSIS.md).

1. **`generateCode()` does not use scenario context** — The code is template-based and does not incorporate the scenario's specific situation. A "Bag Weight Label" session and a "Pocket Money Left" session produce similar code. See [LEARNING_ENGINE](./LEARNING_ENGINE.md) for details.

2. **`mapReasoning()` uses naive keyword matching** — "calculate" matches "recalculate." No stemming or fuzzy matching. This can cause false positives and misses.

3. **No concept prerequisite checking** — A learner can complete a "Builder" scenario before any "Beginner" scenarios. The roadmap in V3 includes adaptive sequencing, but Phase 1 has no prerequisite enforcement.

4. **Reflection is not processed** — The `reflection` field is stored but not analyzed. In a future version, reflection text could feed into the misconception detection or prompt evaluation.

---

## Relationship to Other Phase 1 Documents

- [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) ← you are here
- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← the six functions this document traces through
- [API](./API.md) ← the HTTP endpoint that orchestrates the session
- [ARCHITECTURE](./ARCHITECTURE.md) ← the full stack this interaction traverses
- [VISION](./VISION.md) ← the pedagogical philosophy that drives this interaction design
- [CASE_STUDIES](./CASE_STUDIES.md) ← concrete examples of sessions like the one described here