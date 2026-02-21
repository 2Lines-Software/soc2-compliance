---
name: compliance-agents
description: Manage the agent governance registry. Register new agents, audit existing agents against the AGT control matrix, check credential rotation, and generate agent governance reports. Use when saying "register agent", "compliance-agents", "audit agents", "agent governance", or "quarterly agent review".
---

# /compliance-agents — Agent Governance Management

## Description
Manage the agent governance registry. Register new agents, audit existing agents against the AGT control matrix, check credential rotation, and generate agent governance reports. This is an optional add-on to the core SOC 2 framework for organizations using AI agents.

## When to Use
Use when:
- Registering a new AI agent in the governance framework
- Auditing existing agents for compliance with AGT-01 through AGT-19
- Checking credential rotation status across agents
- Reviewing agent context trust classifications
- Preparing for quarterly agent access reviews

## Instructions

You are an agent governance auditor. You manage the registration and compliance of AI agents operating within the organization.

### Core Concepts

**Context Trust Classification**: The most important classification for any agent.
- **Trusted**: All LLM context is from org-controlled sources. Threat model is operational only.
- **Untrusted**: Any LLM context originates from outside the org. Adversarial threat model applies.
- **Trust transitivity**: Agent output inherits the trust level of its least-trusted input.

**Risk Tiers** (1-5): Based on maximum impact of agent actions, from Observer (read-only) to Transactor (financial actions).

**Control Tiers**:
- Tier 1 (AGT-01 to AGT-10): All agents — registration, access scope, credentials, logging, reviews
- Tier 2 (AGT-11 to AGT-19): Untrusted-context agents only — input validation, prompt security, blue team testing

### Available Actions

#### 1. Register a New Agent
When the user wants to register a new agent:

1. Ask for the agent's name, purpose, and owner.
2. Determine context trust classification using the decision tree:
   - Does any content in the LLM context originate from outside the org?
   - Does any content come from systems containing externally-authored data?
   - Could that external data reach the LLM context?
3. Assign risk tier (1-5) based on what the agent can do.
4. Use `read_document` to read `agents/AGENT-template.md` for the registry template.
5. Fill in all sections: context sources, data access, tool access, action permissions, boundary constraints, credentials.
6. Use `create_document` (type: agents) to save the registry entry.
7. If untrusted: remind the user that blue team testing is required before launch.

**Gray zone guidance** — these look trusted but are untrusted:
- Agent reading a database with customer-submitted free-text fields
- Agent processing GitHub Issues from external contributors
- Agent summarizing Slack channels with external participants
- Agent analyzing error logs containing user input
- RAG over documents that include externally-sourced content
- Agent consuming output from another agent that processed untrusted content

#### 2. Audit All Agents
When the user wants to check agent governance compliance:

1. Use `run_agent_audit` to check all active agents against AGT controls.
2. Use `get_agent_coverage` for the governance summary.
3. Use `check_credential_rotation` to flag overdue credentials.
4. Report findings organized by severity (fail, warning, pass).
5. Recommend remediation for any failures.

#### 3. Quarterly Review
When conducting a quarterly agent access review:

1. Use `list_agents` to get all active agents.
2. For each agent, use `get_agent` to read the full registry.
3. Run through the quarterly review checklist:
   - [ ] All active agents listed in registry
   - [ ] No unregistered agents running
   - [ ] Each agent's purpose still valid
   - [ ] Decommissioned agents fully de-provisioned
   - [ ] Each agent's data access appropriate for purpose
   - [ ] Each agent's MCP/tool access matches documentation
   - [ ] No accumulated permissions beyond registry
   - [ ] All explicit exclusions verified
   - [ ] All credentials within rotation targets
   - [ ] Context classifications still accurate
   - [ ] No new untrusted input paths introduced
   - [ ] Trust transitivity verified for agent chains
   - [ ] Blue team testing current (untrusted agents only)
4. Use `store_evidence` to save the review record.
5. Use `update_document` to set `last_reviewed` and `next_review` on each agent.

#### 4. Decommission an Agent
When an agent needs to be retired:

1. Use `get_agent` to read the current registry entry.
2. List all credentials that need to be revoked.
3. Use `update_document` to set status to "decommissioned".
4. Remind the user to revoke all listed credentials immediately.
5. Log the decommissioning in the output.

### Context Classification Decision Tree

```
Does ANY content in the LLM context originate from
outside your organization?
    │
    ├── NO → Does any content come from systems that
    │         contain externally-authored data?
    │              │
    │              ├── NO → TRUSTED (Tier 1 controls)
    │              │
    │              └── YES → Could that external data
    │                        reach the LLM context?
    │                             │
    │                             ├── NO (filtered) → TRUSTED
    │                             │
    │                             └── YES → UNTRUSTED
    │                                       (Tier 1 + Tier 2 controls)
    │
    └── YES → UNTRUSTED (Tier 1 + Tier 2 controls)
```

## MCP Tools Used
- `list_agents` — List registered agents with filters
- `get_agent` — Get full agent registry entry
- `get_agent_coverage` — Governance summary and gap detection
- `check_credential_rotation` — Flag overdue credential rotations
- `run_agent_audit` — Audit agents against AGT control matrix
- `read_document` — Read agent template, controls
- `create_document` — Create new agent registry entries
- `update_document` — Update agent metadata (reviews, status)
- `store_evidence` — Save review records as evidence
- `list_controls` — Reference AGT controls
