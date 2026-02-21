# SOC 2 Compliance Worker Framework

## Project Overview
A lightweight SOC 2 compliance framework for companies with <5 people. Uses markdown documents as the data store, an MCP server as the agent interface, and Claude Code skills for automation.

## Architecture
See `soc2-agent-architecture.md` for the full design. Key layers:
1. **Markdown Knowledge Base** (`compliance/`) — source of truth for all compliance data
2. **MCP Server** (`src/`) — TypeScript server providing tools for agents
3. **Skills** (`.claude/skills/`) — Claude Code skills implementing agent workflows

## TSC Scope
- **Security**: Common Criteria CC1-CC9
- **Confidentiality**: C1

## Key Directories
- `compliance/controls/` — TSC control mappings (reference data, rarely changes)
- `compliance/config/` — Company-specific scope and configuration
- `compliance/policies/` — Generated policy documents
- `compliance/evidence/` — Collected evidence artifacts
- `compliance/gaps/` — Gap analysis reports
- `compliance/assessments/` — Audit readiness assessments
- `templates/` — Templates for policies, evidence, and reports
- `src/` — MCP server source code

## Document Conventions
- All compliance documents use YAML frontmatter for metadata
- Frontmatter fields: id, title, status, owner, tsc_criteria, version, last_reviewed, next_review
- Status lifecycle: draft → review → approved → expired
- Evidence files are timestamped: `YYYY-MM-DD-description.ext`

## MCP Server
- Entry point: `src/index.ts`
- Uses stdio transport
- Tool groups: documents, controls, evidence, assessment
- All paths are relative to `compliance/` directory

## Skills
- `/compliance-init` — Initialize framework for a company
- `/compliance-gap` — Run gap assessment (4-phase: discover → map → assess → report)
- `/compliance-policy` — Generate policies from gap report
- `/compliance-evidence` — Collect and organize evidence
- `/compliance-audit` — Check audit readiness

## Solo-Company Adaptations
This framework is designed for 1-5 person companies. Key adaptations:
- Compensating controls documented where separation of duties cannot be met
- Automated CI gates substitute for human review processes
- Quarterly self-review checklists replace manager-led access reviews
- Self-directed training replaces formal training programs

## How the Agents Work with Infrastructure
The skills are designed to be **progressively automated**:
- With no infrastructure MCPs: agents ask the user questions and record answers as evidence
- With GitHub MCP: agents automatically pull branch protection, CI config, collaborator access
- With cloud provider MCP: agents pull IAM, encryption, network, logging config
- With identity provider MCP: agents pull MFA status, user directory, password policies

Each skill checks what MCPs are available and adapts accordingly. The gap assessment agent's "discover" phase uses whatever is connected and falls back to interactive questions for the rest.

## Contributing
When adding new infrastructure MCP integrations:
1. The skill files in `.claude/skills/` describe what data to collect from each source
2. The control mappings in `compliance/controls/` have `MCP discovery targets` fields showing what maps where
3. Evidence should be stored via the `store_evidence` MCP tool with appropriate `control_ids`
4. Follow existing patterns: automated evidence goes in `evidence/automated/{source}/`, named `YYYY-MM-DD-description.ext`
