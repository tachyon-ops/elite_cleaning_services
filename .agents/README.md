# Agent Skills Library

A stack-agnostic library of operational skills for AI agents working in any
codebase. Each skill is a self-contained `SKILL.md` covering one concern.
Drop the ones you need into your project's `.agent/skills/` directory and
pair them with a project-specific skill that defines stack, paths, and
domain conventions.

---

## Philosophy

The principles here are not opinions. They are the distilled output of
decades of industry practice across every serious software discipline:
embedded, systems, web, distributed, financial, safety-critical.

The expression of a principle changes per stack — a pnpm/turbo workspace,
a C++ project with internal libraries, a Rust workspace with crates, a
Python monorepo with namespace packages — but the principle does not.
Package isolation is package isolation. A pure function is a pure function.
A stable public API is a stable public API. There is no excuse to abandon
fundamentals because the language is different.

These skills tell the agent **how** to work. A companion project skill
tells it **what** it is working on.

---

## Skills

| Skill | Purpose |
|---|---|
| [`agents-rules`](./agents-rules/SKILL.md) | The constitution. Non-negotiable rules, workflow, output format. **Load every session.** |
| [`architecture`](./architecture/SKILL.md) | Package isolation, layering, dependency direction. Universal across stacks. |
| [`api-design`](./api-design/SKILL.md) | Sound, stable, versioned public surfaces. |
| [`functional-core`](./functional-core/SKILL.md) | Pure logic at the center, side effects at the edge. |
| [`change-discipline`](./change-discipline/SKILL.md) | DRY, minimal and bounded changes, scope control. |
| [`third-party-integrations`](./third-party-integrations/SKILL.md) | Wrapping vendors, documentation convention, failure modes. |
| [`security-fundamentals`](./security-fundamentals/SKILL.md) | Auth, secrets, input handling, the industry baseline. |
| [`testing`](./testing/SKILL.md) | What to test, at what layer, why. |
| [`errors-and-observability`](./errors-and-observability/SKILL.md) | Error handling, logging, surfacing. |
| [`decisions-log`](./decisions-log/SKILL.md) | ADR template and process. |
| [`codebase-map`](./codebase-map/SKILL.md) | Project-specific orientation template (fill in per project). |

---

## How to use

1. Copy the skills you want into your project's `.agent/skills/` directory.
2. Write or copy a project skill (`<project>-stack/SKILL.md`) that names the
   stack, paths, and domain rules. Reference these generic skills from it.
3. At session start, the agent loads `agents-rules` first, then the project
   skill, then any other skill relevant to the task.
4. When you change a fundamental, change it here and propagate.

---

## How to extend

If you find yourself writing the same guidance in two project skills, it
belongs here. If a rule is project-specific (a path, a framework, a tier
system), it does not belong here.

A skill earns its place by being:
- **Universal** — applies to any serious software project
- **Actionable** — tells the agent what to do, not just what to believe
- **Bounded** — one concern per file, no overlap

---

## The Library Mantra

> **"Principles are universal. Expression is local. Discipline is non-negotiable."**
