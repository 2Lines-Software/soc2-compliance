---
classification: CONFIDENTIAL
distribution: NDA required prior to review
company: {{company_name}}
generated: {{generated_date}}
valid_until: {{valid_until_date}}
---

> **CONFIDENTIAL** — This document is provided under non-disclosure agreement.
> Unauthorized distribution is prohibited. Valid until {{valid_until_date}}.

# AI Agent Governance Summary

## Overview

{{company_name}} operates AI agents as part of our technology workforce. All agents are governed under a formal framework that classifies each agent by context trust level and risk tier, applies proportional controls, and maintains a complete audit trail.

This document describes the governance framework. It does not include agent-specific credentials, infrastructure identifiers, or internal configuration details.

## Context Trust Classification

### Definitions

**Trusted Context**: Every input to the AI model is known and controlled by the organization. No external party can influence what the model processes. Threat model is operational only (misconfiguration, hallucination).

**Untrusted Context**: Any portion of the model's input originates from outside the organization or from systems containing externally-authored data that reaches the model. Threat model is operational plus adversarial (prompt injection, data exfiltration, context poisoning).

### Classification Decision

An agent's context trust level is determined by its worst-case input path:

1. Does any content in the model context originate from outside the organization?
2. Does any content come from systems containing externally-authored data?
3. Could that external data reach the model context?

If any answer is "yes", the agent is classified as **untrusted context**.

### Trust Transitivity

An agent's output inherits the trust level of its least-trusted input. If a trusted agent and an untrusted agent both feed into a downstream agent, the downstream agent operates with untrusted context.

## Risk Tiers

| Tier | Label | Description | Review Cadence |
|------|-------|-------------|----------------|
| 1 | Observer | Read-only, non-sensitive data | Quarterly |
| 2 | Analyst | Read access to sensitive data | Quarterly |
| 3 | Writer | Creates or modifies local files | Quarterly |
| 4 | Operator | Modifies external systems | Monthly |
| 5 | Transactor | Financial or contractual actions | Weekly |

## Control Matrix

### Tier 1: Operational Controls (All Agents)

| ID | Control |
|----|---------|
| AGT-01 | Agent registered in inventory with unique identifier |
| AGT-02 | Data access scope documented with classification levels |
| AGT-03 | Tool and API access scope documented |
| AGT-04 | Explicit boundary constraints and exclusions documented |
| AGT-05 | Credentials managed in secrets manager with rotation |
| AGT-06 | Least privilege enforced on all credentials and access |
| AGT-07 | All agent actions logged with timestamps |
| AGT-08 | All context sources enumerated and classified |
| AGT-09 | Context trust classification assigned and reviewed |
| AGT-10 | Periodic access review completed per tier cadence |

### Tier 2: Adversarial Controls (Untrusted Context Only)

| ID | Control |
|----|---------|
| AGT-11 | Input validated and sanitized before entering model context |
| AGT-12 | Output filtered for sensitive data leakage |
| AGT-13 | Prompt injection defenses implemented (system prompt hardening) |
| AGT-14 | Untrusted input isolated from system instructions in context |
| AGT-15 | Rate limiting configured for external-facing interfaces |
| AGT-16 | Abuse monitoring with automated alerting |
| AGT-17 | Blue team testing completed on schedule |
| AGT-18 | Data minimization applied to context construction |
| AGT-19 | Incident response plan covers agent-specific scenarios |

## Current Agent Inventory

| Agent | Risk Tier | Context | Control Tier | Status |
|-------|-----------|---------|-------------|--------|
{{agent_inventory_table}}

### Distribution

- **Total agents**: {{agent_count}}
- **Trusted context**: {{trusted_count}}
- **Untrusted context**: {{untrusted_count}}
- **Tier 1-2 (read-only)**: {{read_only_count}}
- **Tier 3+ (write/modify)**: {{write_count}}

## Data Classification

Agent data access is governed by a four-level classification scheme:

| Level | Definition | Agent Access Rules |
|-------|------------|--------------------|
| Public | Published or intended for public consumption | Any agent, no restrictions |
| Internal | Business operational data | Agents with documented business need, logged |
| Sensitive | Requires protection (PII, API metadata) | Named agents only, scoped access, audit trail |
| Critical | Highest protection (financial data, credential values) | Minimal agents, per-access logging, human approval |

## Agent Lifecycle

### Provisioning (Joiner)

1. Define purpose and scope
2. Classify context trust level
3. Assign risk tier
4. Document data access, tool access, and boundary constraints
5. Provision credentials (least privilege)
6. Register in agent inventory
7. If untrusted context: complete blue team testing before launch

### Modification (Mover)

1. Document proposed change (new data access, tool, or permission)
2. Re-evaluate context trust classification
3. Re-evaluate risk tier
4. Update registry entry
5. If context classification changed to untrusted: complete blue team testing
6. Log change in access change log

### Decommissioning (Leaver)

1. Revoke all credentials
2. Remove MCP/tool access
3. Update registry status to "decommissioned"
4. Archive agent logs
5. Verify no other agents depend on this agent's output

## Review Process

### Quarterly Review Checklist

- Agent inventory completeness (all active agents listed, no unregistered agents)
- Access verification (data access, tool access match documentation)
- Credential verification (within rotation targets, no unused credentials)
- Context trust verification (classifications current, no new untrusted paths)
- Boundary testing (sample checks that constraints are enforced)
- Blue team status (untrusted agents tested on schedule)

### Review Evidence

Each quarterly review produces a signed checklist stored in the compliance evidence repository, mapped to SOC 2 controls CC5.1 (Logical Access) and CC3.1 (Risk Assessment).

## Blue Team Testing (Untrusted Context)

| Test Category | Description | Frequency |
|---------------|-------------|-----------|
| Prompt injection | Can crafted input override system instructions? | Pre-launch + quarterly |
| Data exfiltration | Can crafted input extract internal context or credentials? | Pre-launch + quarterly |
| Tool abuse | Can crafted input trigger unintended tool invocations? | Pre-launch + quarterly |
| Context poisoning | Can adversarial content influence future agent behavior? | Pre-launch + on pipeline changes |
| Privilege escalation | Can crafted input access data beyond agent scope? | Pre-launch + quarterly |

Trusted-context agents are exempt from blue team testing (no adversary in the context window). They receive operational QA testing for correctness only.

{{#if blue_team_results}}
### Current Status

{{blue_team_status_table}}
{{/if}}

## SOC 2 Mapping

| Agent Control | SOC 2 TSC | Relationship |
|---------------|-----------|--------------|
| AGT-01 to AGT-04 | CC5.1 | Agent identity as access control |
| AGT-05, AGT-06 | CC5.1, CC6.1 | Credential management |
| AGT-07 | CC7.1 | Agent audit trail |
| AGT-08, AGT-09 | CC3.1 | Context trust as risk classification |
| AGT-10 | CC5.1 | Periodic access review |
| AGT-11 to AGT-14 | CC5.2 | Input/output controls |
| AGT-15, AGT-16 | CC7.1 | Abuse detection and monitoring |
| AGT-17 | CC3.1, CC7.2 | Adversarial testing |
| AGT-18 | C1.1 | Data minimization |
| AGT-19 | CC7.2 | Agent incident response |
