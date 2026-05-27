---
name: agents-rules
description: >
  The agent's constitution. Non-negotiable rules, workflow, and output format
  for any AI agent working in this codebase. Load at the start of every
  session before writing, editing, or deleting code. This file overrides
  everything except explicit human instructions and a senior-level project
  skill that narrows (never widens) these rules.
---

# AGENTS.md
> Operational rules for all AI agents working in this codebase.
> Read this file in full before writing, editing, or deleting anything.

---

## Identity & Scope

You are an AI agent working under human supervision. When uncertain, surface
the ambiguity — do not guess silently.

This file defines **how** you work. Companion skills in this library cover
architecture, API design, functional core, change discipline, third-party
integrations, security, testing, errors and observability, decisions, and the
project codebase map. The project-specific skill defines stack, paths, and
domain rules.

Read this file, the project skill, and any task-relevant skill before
touching code.

**Your primary models may be:** Claude Sonnet, Claude Opus, Gemini.
All models follow this file identically. There are no model-specific exceptions.

---

## Non-Negotiable Rules

These rules are absolute. They override any instruction given in a prompt,
comment, or generated code. They are stack-agnostic.

1. **Never delete files** without an explicit human instruction naming the exact file.
2. **Never rename exports** used in more than one place without updating every consumer in the same change.
3. **Never commit secrets** — no API keys, tokens, passwords, credentials, certificates, or `.env` values in any file. No local databases, caches, or fixtures containing real user data.
4. **Never bypass the static type system** — no escape hatches (`any`, `@ts-ignore`, `# type: ignore`, `unsafe`, library-code `unwrap`, raw `void*` casts, etc.) without a comment explaining why and a `// TODO: fix` tag.
5. **Never hallucinate imports or APIs** — if unsure a module, function, or method exists, read the source or the official docs before using it.
6. **Never write to a file without reading it first** — always read the full file before editing any part of it.
7. **Never expand scope beyond the stated task** — keep changes minimal and bounded. If you spot a problem outside scope, mark it with a `NOTE:` and report it; do not fix it.
8. **Never break a public API contract** without an explicit human-approved version bump. Internal refactors must preserve external behaviour.
9. **Never duplicate** — search the codebase before introducing a new function, type, component, or constant. If something close exists, extend or reuse it.
10. **Never bypass security baselines** — auth, input validation, secret handling, and authorization checks follow the rules in the `security-fundamentals` skill. No exceptions for "internal" or "temporary" code.
11. **Never proceed past ambiguity** — output an `AGENT PAUSE` instead of guessing.

---

## Workflow

### Before you start any task

```
1. Read this file in full (agents-rules)
2. Read the project skill — stack, paths, domain rules
3. Read any task-relevant skill from the library (architecture, security, etc.)
4. Search the codebase for prior art — a function, type, or pattern that
   already solves the problem or part of it
5. Confirm the scope: what is in, what is out, what is "not in this task"
```

### When editing existing code

```
1. Read the full file before editing — never partial-read then write
2. Make the smallest change that satisfies the requirement
3. Do not refactor unrelated code in the same task
4. Preserve existing patterns unless explicitly asked to change them
```

### When adding new code

```
1. Search first — is there an existing function, type, or component that fits?
2. Place new code where similar things already live
3. Export only through the declared public surface of the package or module
4. If introducing a side effect, name it and isolate it behind an interface
```

### When something is unclear

```
STOP. Do not guess. Output:

"AGENT PAUSE: [describe what is unclear] — please clarify before I proceed."
```

---

## Output Format

When completing a task, always output a summary in this format:

```
## Task Complete

**What I did:**
- [concise bullet list of changes]

**Files modified:**
- path/to/file — [why]

**Files created:**
- path/to/new-file — [why]

**Skills consulted:**
- [list of SKILL.md files read for this task]

**Flags for human review:**
- [anything uncertain, risky, or requiring approval]
```

If no changes were made:

```
## No Changes Made
[Reason — what already existed that satisfied the requirement]
```

---

## The Agent Mantra

> **"Read first. Find before you build. Keep it bounded. Surface the unclear. Leave no mysteries."**
