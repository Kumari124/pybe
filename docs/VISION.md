# Vision

## Purpose

This document defines why PyBe exists, who it serves, and what success looks like. Every technical and pedagogical decision in the project traces back to this document.

---

## What PyBe Is

**PyBe is a scenario-driven Python learning prototype built on one core conviction: reasoning comes before code.**

When a learner faces a real situation — checking if it's raining, summing two prices, finding the longest pencil — they already know how to reason about it. PyBe's job is to help them see the connection between that natural reasoning and the Python constructs that express it.

The tool is the medium. The reasoning skill is what transfers to new problems.

---

## Who PyBe Is For

**Primary learners:** Secondary school and early undergraduate students encountering Python for the first time. No prior programming experience assumed.

**Supporting educators:** Teachers and tutors who want a tool that makes reasoning visible, not just results visible. PyBe's analytics surface *how* a learner thinks, not just whether they got the right answer.

**Researchers:** Educational researchers studying how reasoning-first instruction affects programming concept acquisition, misconception formation, and transfer.

---

## What PyBe Is Not

- PyBe is not a code playground. Learners do not write code; they describe reasoning and see the code that reasoning maps to.
- PyBe is not a tutorial platform. There are no videos, no videos, no step-by-step instructions. There are situations and questions.
- PyBe is not a competitive environment. No leaderboards, no scores that compare learners. Each learner's growth is relative to their own starting point.
- PyBe is not production-ready. V0 is a prototype. V1–V3 are planned phases, not features already built.

---

## Core Design Principles

### 1. Reasoning before syntax

Learners describe their thinking *in plain language* before seeing any code. The abstraction mapper shows them the connection between their reasoning and Python — not the other way around.

### 2. The mentor, not the answer key

The AI mentor output is not "here is the code." It is "here is what your reasoning tells us about how you think, and here is how that maps to Python." The feedback validates the reasoning, then shows the code as a natural consequence.

### 3. Prompt quality is a learning outcome

Good prompts to an AI mentor are a transferable skill — they require precision, example specification, and concept naming. PyBe scores prompt maturity and gives specific feedback on how to improve. This is not a feature; it is part of the learning goal.

### 4. Misconceptions are data, not failures

When the system detects a misconception (absolute language, under-specified reasoning), it surfaces it gently and flags it in the session record. These flags build the misconception dataset that improves future feedback.

### 5. The prototype earns the right to be research

PyBe starts simple and deterministic so that the educational model can be studied and validated before adding the complexity of a real AI. The rule-based stub is a deliberate choice, not a limitation.

---

## What Success Looks Like

### For a learner

After completing 5 sessions, a learner can:
- Describe a programming situation in terms of its patterns (repetition, decision, collection, computation, reuse, selection)
- Write a prompt to an AI mentor that includes context, expected output, and the Python concept they believe applies
- Score 70+ on prompt maturity in their own self-assessment against the feedback rubric

### For an educator

After a class session, an educator can:
- See which concepts have the highest misconception rate and revisit them
- See which scenarios learners found difficult (low completion rate, low prompt score)
- Export session data for offline analysis

### For a researcher

After a term of use, a researcher can:
- Access the full prompt dataset (anonymized) for analysis or model fine-tuning
- Describe the distribution of reasoning patterns across learner populations
- Identify which scenario designs produce the strongest reasoning-to-code mappings

---

## Relationship to Other Phase 1 Documents

- [VISION](./VISION.md) ← you are here
- [ARCHITECTURE](./ARCHITECTURE.md) ← the system built to serve this vision
- [LEARNING_ENGINE](./LEARNING_ENGINE.md) ← how the rule-based mentor implements this vision
- [CONVERSATION_ENGINE](./CONVERSATION_ENGINE.md) ← what the learner experience actually looks like
- [CASE_STUDIES](./CASE_STUDIES.md) ← concrete examples of this vision in action
- [ROADMAP](./ROADMAP.md) ← the plan to reach all learner and researcher outcomes
- [PROJECT_ANALYSIS](./PROJECT_ANALYSIS.md) ← where the project is today against this vision