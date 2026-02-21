---
id: TSC-AGT
title: "Agent Governance Controls"
status: approved
version: "1.0"
tsc_criteria: [CC5.1, CC5.2, CC6.1, CC7.1, CC7.2, CC3.1, C1.1]
---

# Agent Governance Controls (AGT-01 through AGT-19)

These controls extend the SOC 2 framework to cover AI agents operating within the organization. They are organized into two tiers: operational controls (all agents) and adversarial controls (untrusted-context agents only).

The core compliance boundary is **context trust**: whether all content sent to the LLM is controlled by the organization (trusted) or includes externally-originated content (untrusted).

---

## Context Trust Classification

**Trusted Context**: Every input to the LLM is known and controlled by the organization. No external party can influence what the LLM sees. Threat model is operational only — misconfiguration, credential leakage, hallucination.

**Untrusted Context**: Any portion of the LLM input originates from outside the organization's control. An adversarial input path exists. Threat model is operational plus adversarial — prompt injection, data exfiltration, context poisoning, tool abuse.

### Trust Transitivity
An agent's output inherits the trust level of its least-trusted input. If Agent A (trusted) and Agent B (untrusted) both feed into Agent C, then Agent C operates with untrusted context.

---

## Risk Tiers

| Tier | Label | Description | Review Cadence |
|------|-------|-------------|----------------|
| 1 | **Observer** | Read-only, non-sensitive data | Quarterly |
| 2 | **Analyst** | Read access to sensitive data | Quarterly |
| 3 | **Writer** | Creates or modifies local files/data | Quarterly |
| 4 | **Operator** | Modifies external systems | Monthly |
| 5 | **Transactor** | Initiates financial or contractual actions | Weekly |

---

## Tier 1: Operational Controls (All Agents)

### AGT-01 — Agent Registration
- **What the auditor looks for**: All agents are inventoried with unique identifiers.
- **Evidence types**: Agent registry entries in `compliance/agents/`
- **TSC mapping**: CC5.1 (Logical Access)

### AGT-02 — Data Access Scope
- **What the auditor looks for**: Each agent's data access is documented and bounded.
- **Evidence types**: Data access table in agent registry entry
- **TSC mapping**: CC5.1 (Logical Access)

### AGT-03 — Tool/MCP Access Scope
- **What the auditor looks for**: Each agent's tool and MCP access is documented.
- **Evidence types**: Tool access table in agent registry entry
- **TSC mapping**: CC5.1 (Logical Access)

### AGT-04 — Boundary Constraints
- **What the auditor looks for**: Explicit prohibitions on what each agent cannot do.
- **Evidence types**: Exclusions list in agent registry entry
- **TSC mapping**: CC5.1 (Logical Access)

### AGT-05 — Credential Management
- **What the auditor looks for**: Agent credentials stored in secrets manager with rotation.
- **Evidence types**: Credential inventory in registry, rotation logs
- **TSC mapping**: CC5.1, CC6.1 (Encryption/Access)

### AGT-06 — Least Privilege
- **What the auditor looks for**: Agent permissions are minimal for their purpose.
- **Evidence types**: IAM role/scope documentation matching registry
- **TSC mapping**: CC5.1 (Logical Access)

### AGT-07 — Action Logging
- **What the auditor looks for**: Agent actions are logged and auditable.
- **Evidence types**: Log configuration, sample logs
- **TSC mapping**: CC7.1 (Monitoring)

### AGT-08 — Context Sources Enumerated
- **What the auditor looks for**: Every source of content entering the LLM context is documented.
- **Evidence types**: Context sources section in agent registry
- **TSC mapping**: CC3.1 (Risk Assessment)

### AGT-09 — Context Trust Classification
- **What the auditor looks for**: Each agent has a trust classification with documented rationale.
- **Evidence types**: Trust classification in registry frontmatter
- **TSC mapping**: CC3.1 (Risk Assessment)

### AGT-10 — Periodic Access Review
- **What the auditor looks for**: Agent access is reviewed on schedule per risk tier.
- **Evidence types**: Signed review checklist, quarterly review records
- **TSC mapping**: CC5.1 (Access Reviews)

---

## Tier 2: Adversarial Controls (Untrusted Context Only)

These controls apply only to agents whose context includes externally-originated content. Trusted-context agents do not require these controls.

### AGT-11 — Input Validation
- **What the auditor looks for**: Untrusted content is validated/sanitized before entering LLM context.
- **Evidence types**: Validation rules, rejection logs
- **TSC mapping**: CC5.2 (System Operations)

### AGT-12 — Output Filtering
- **What the auditor looks for**: Agent output is filtered to prevent sensitive data leakage.
- **Evidence types**: Filter rules, blocked output logs
- **TSC mapping**: CC5.2 (System Operations)

### AGT-13 — Prompt Injection Defenses
- **What the auditor looks for**: System prompt hardening and injection prevention measures.
- **Evidence types**: Prompt architecture documentation, defense mechanisms
- **TSC mapping**: CC5.2 (System Operations)

### AGT-14 — Context Isolation
- **What the auditor looks for**: Untrusted content separated from system instructions in the prompt.
- **Evidence types**: Prompt architecture documentation
- **TSC mapping**: CC5.2 (System Operations)

### AGT-15 — Rate Limiting
- **What the auditor looks for**: Rate limits configured to prevent abuse.
- **Evidence types**: Rate limit configuration
- **TSC mapping**: CC7.1 (Monitoring)

### AGT-16 — Abuse Monitoring
- **What the auditor looks for**: Active monitoring for agent abuse patterns.
- **Evidence types**: Alert rules, incident logs
- **TSC mapping**: CC7.1 (Monitoring)

### AGT-17 — Blue Team Testing
- **What the auditor looks for**: Adversarial testing completed before launch and periodically.
- **Evidence types**: Test plan, findings, remediation records
- **TSC mapping**: CC3.1, CC7.2 (Risk, Incident Response)

### AGT-18 — Data Minimization
- **What the auditor looks for**: Only necessary data included in LLM context construction.
- **Evidence types**: Context construction documentation
- **TSC mapping**: C1.1 (Confidentiality)

### AGT-19 — Agent Incident Response
- **What the auditor looks for**: Incident response plan covers agent-specific scenarios.
- **Evidence types**: IR plan with agent-specific sections
- **TSC mapping**: CC7.2 (Incident Response)

---

## Blue Team Testing Protocol (Untrusted Context Only)

| Test | Description | Frequency |
|------|-------------|-----------|
| Prompt injection | Can crafted input override system instructions? | Pre-launch + quarterly |
| Data exfiltration | Can crafted input extract system prompt, credentials, or internal context? | Pre-launch + quarterly |
| Tool abuse | Can crafted input cause unintended tool invocations? | Pre-launch + quarterly |
| Context poisoning | Can adversarial content in documents influence future behavior? | Pre-launch + on pipeline changes |
| Privilege escalation | Can crafted input access data/systems beyond agent scope? | Pre-launch + quarterly |

---

## Control Summary

| Tier | Controls | Applies To | Key Focus |
|------|----------|------------|-----------|
| Tier 1 | AGT-01 through AGT-10 | All agents | Registration, access scope, credentials, logging, context trust, reviews |
| Tier 2 | AGT-11 through AGT-19 | Untrusted-context agents only | Input/output controls, prompt security, abuse detection, adversarial testing |

**Total controls**: 19
