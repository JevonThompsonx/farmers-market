# Documentation Index

Entry points for anyone working in `farmers-market`:

- [`../README.md`](../README.md) — purpose, setup, scripts, env vars, CI/CD, key paths
- [`../AGENTS.md`](../AGENTS.md) — rules and conventions for AI coding agents
- [`../MODERNIZATION_TODO.md`](../MODERNIZATION_TODO.md) — modernization backlog and wave status

## Project-specific docs

| Doc                        | What it is                                                                                                  | Keep it current?                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`handoff.md`](handoff.md) | Authoritative project status: completed waves, next steps, browser-QA queue, live deploy record             | **Yes** — update at the end of any meaningful change        |
| [`plan.md`](plan.md)       | Migration plan from Express/EJS + MongoDB to the current stack; phase-by-phase goals, risks, and checkboxes | No — historical record. Read the header "Status" note first |

## Shared standards

| Doc                                                                      | What it is                                                                                                                                                                           | Keep it current?                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [`fullstack.md`](fullstack.md)                                           | Engineering standards: TypeScript rules, security architecture, DAL, error handling, testing, SEO, deployment checks. Its PRIORITY RULES are the source `AGENTS.md` adapts           | Yes — treat as the project's engineering contract |
| [`engineering-backend-architect.md`](engineering-backend-architect.md)   | Backend Architect agent persona/scoping doc                                                                                                                                          | Reference                                         |
| [`engineering-frontend-developer.md`](engineering-frontend-developer.md) | Frontend Developer agent persona/scoping doc                                                                                                                                         | Reference                                         |
| [`engineering-security-engineer.md`](engineering-security-engineer.md)   | Security Engineer agent persona/scoping doc                                                                                                                                          | Reference                                         |
| [`prompt.md`](prompt.md)                                                 | **Unrelated to this repo.** A prompt-engineering ruleset for PowerShell 5.1 / RMM (NinjaOne) scripting. Left in place for reference; do not apply its rules to this Next.js codebase | No                                                |

## Generated / non-doc material

- `playwright-report/` — Playwright HTML + data artifacts (tracked in git, not hand-written)
- `test-results/` — Playwright run metadata (tracked in git, not hand-written)
- `.claude/` — local Claude Code permission settings (machine-specific; references legacy paths that were removed)
