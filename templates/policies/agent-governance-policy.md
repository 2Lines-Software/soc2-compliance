---
id: POL-013
title: Agent Governance Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC5.1, CC5.2, CC6.1, CC7.1, CC7.2, CC3.1, C1.1]
last_reviewed: null
next_review: null
---

# Agent Governance Policy

**Document ID**: POL-013
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC5.1, CC5.2, CC6.1, CC7.1, CC7.2, CC3.1, C1.1

## 1. Purpose

This policy governs the registration, classification, access control, and monitoring of all AI agents operating within {{company_name}}'s systems. It ensures agents are treated as managed identities with documented permissions, explicit boundaries, and periodic review.

## 2. Scope

All AI agents, whether internal productivity tools or client-facing services, that:
- Access company data or systems
- Use MCP integrations or API credentials
- Generate or modify documents, code, or configurations
- Interact with external services on behalf of the organization

## 3. Policy Statements

### 3.1 Agent Registration (AGT-01)
- Every agent is registered in the agent governance registry (`compliance/agents/`).
- Each registration includes: purpose, owner, risk tier, context trust classification, data access scope, tool access scope, boundary constraints, and credential inventory.
- No agent operates without a registry entry.

### 3.2 Context Trust Classification (AGT-08, AGT-09)
- Every agent is classified as **trusted** or **untrusted** based on whether any content in the LLM context originates from outside the organization's control.
- Classification follows the decision tree in the Agent Governance Framework.
- Trust transitivity: an agent's output inherits the trust level of its least-trusted input.
- Gray zone scenarios (customer data in DB fields, external contributor content, shared Slack channels) default to untrusted.

### 3.3 Risk Tiering
Agents are tiered by maximum impact of their actions:

| Tier | Label | Description | Review Cadence |
|------|-------|-------------|----------------|
| 1 | Observer | Read-only, non-sensitive data | Quarterly |
| 2 | Analyst | Read access to sensitive data | Quarterly |
| 3 | Writer | Creates or modifies local files/data | Quarterly |
| 4 | Operator | Modifies external systems | Monthly |
| 5 | Transactor | Initiates financial or contractual actions | Weekly |

### 3.4 Access Control (AGT-02 through AGT-06)
- Agents follow the principle of least privilege.
- Data access and tool access are explicitly documented and bounded.
- Boundary constraints define what each agent explicitly cannot do.
- Agent credentials are stored in {{secrets_provider}} and rotated every 90 days.
- Each agent's permissions match its documented registry entry — drift is a finding.

### 3.5 Monitoring and Logging (AGT-07)
- All agent actions are logged.
- Logs are retained per the Logging & Monitoring Policy (POL-012).
- Anomalous agent behavior triggers alerting per standard monitoring.

### 3.6 Periodic Review (AGT-10)
- Agent registrations are reviewed on the cadence set by their risk tier.
- Reviews verify: access is still appropriate, credentials are rotated, context classification is still accurate, boundary constraints are enforced.
- Review records are stored as compliance evidence.

### 3.7 Untrusted-Context Controls (AGT-11 through AGT-19)
Agents classified as untrusted must additionally implement:
- Input validation and sanitization before LLM context
- Output filtering for sensitive data
- Prompt injection defenses and context isolation
- Rate limiting and abuse monitoring
- Blue team adversarial testing (pre-launch + quarterly)
- Data minimization in context construction
- Agent-specific incident response procedures

### 3.8 Blue Team Testing
Untrusted-context agents undergo adversarial testing covering:
- Prompt injection (can input override system instructions?)
- Data exfiltration (can input extract internal context?)
- Tool abuse (can input cause unintended tool invocations?)
- Context poisoning (can adversarial content influence behavior?)
- Privilege escalation (can input access data beyond agent scope?)

Testing is required pre-launch and quarterly thereafter. Trusted-context agents do not require blue team testing.

### 3.9 Decommissioning
- Decommissioned agents have all credentials revoked immediately.
- Registry entry status is set to "decommissioned" (not deleted — audit trail).
- Decommissioning is recorded in the access change log.

## 4. Procedures

### 4.1 Registering a New Agent
1. Create registry entry from template (`compliance/agents/AGENT-template.md`)
2. Complete all required sections (context sources, data access, tool access, boundaries, credentials)
3. Classify context trust using the decision tree
4. Assign risk tier based on maximum action impact
5. Determine control tier (tier-1 for trusted, tier-1-plus-tier-2 for untrusted)
6. If untrusted: complete blue team testing before launch
7. Submit for review and approval
8. Record in access change log

### 4.2 Quarterly Agent Review
1. Run `/compliance-agents` to generate current agent inventory
2. Verify each active agent's registry entry matches actual permissions
3. Check credential rotation compliance
4. Verify context classifications are still accurate
5. For untrusted agents: verify blue team testing is current
6. Document review findings and remediation actions

## 5. Exceptions

Agents operating without full registry documentation require:
- Documented justification
- Maximum 30-day remediation timeline
- Interim compensating controls (additional monitoring, restricted scope)

## 6. Enforcement

Unregistered agents discovered in operation are treated as security incidents. Agent access that drifts from registry documentation is flagged for immediate remediation.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
