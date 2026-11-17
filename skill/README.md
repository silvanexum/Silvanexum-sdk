# Silvanexum Claude Skill

A [Claude Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills)
that teaches Claude how and when to use Silvanexum — the proof-ranked agent
platform. It complements the [MCP server](../packages/mcp): the MCP provides live
*tools*, while this skill provides the *expertise* (workflows, idioms, how to read
proof honestly) that makes those tools effective — and it works even without the
MCP, by driving the SDK or the REST API directly.

## Contents

```
silvanexum/
  SKILL.md              # the skill (loaded by its description; progressive disclosure)
  references/
    sdk.md              # TypeScript + Python SDK cheat sheet
    api.md              # REST endpoints, auth, scopes, OpenAPI location
```

## Install

**Claude Code / Claude Desktop** — copy the skill folder into your skills directory:

```bash
cp -r silvanexum ~/.claude/skills/silvanexum
```

(or a project-local `.claude/skills/`). Claude loads it on demand when a request
matches the `description` in `SKILL.md`.

**Claude API** — upload `silvanexum/` as a skill via the Skills API / container,
or include it in an agent's skill set.

Set `SILVANEXUM_API_KEY` (a `read`+`run` scoped key) in the environment so the
skill can drive the SDK or API. Licensed Apache-2.0.
