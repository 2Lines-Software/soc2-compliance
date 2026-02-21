# Agent Governance Framework

## Overview

This document defines the agent inventory, context trust classification, and control requirements for AI agents operating within the organization. It extends the SOC 2 compliance framework with agent-specific controls and integrates with the existing MCP server tooling.

All agents — whether internal productivity tools or client-facing services — are registered, classified, and governed through this framework. The core compliance boundary is **context trust**: whether the content sent to the LLM is fully controlled by the organization (trusted) or includes externally-originated content (untrusted).

---

## Context Trust Classification

### Definitions

**Trusted Context**: The provenance of every input to the LLM is known and controlled by the organization. No external party can influence what the LLM sees. The threat model is operational only — misconfiguration, credential leakage, hallucination. No adversarial actor exists in the context window.

**Untrusted Context**: Any portion of the LLM input originates from outside the organization's control, or from sources that could be influenced by an external party. An adversarial input path exists. The threat model is operational plus adversarial — prompt injection, data exfiltration, context poisoning, tool abuse through manipulated input.

### Classification Decision

```
Does ANY content in the LLM context originate from
outside your organization?
    │
    ├── NO → Does any content come from systems that
    │         contain externally-authored data?
    │              │
    │              ├── NO → TRUSTED
    │              │         Tier 1 controls
    │              │
    │              └── YES → Could that external data
    │                        reach the LLM context?
    │                             │
    │                             ├── NO (filtered) → TRUSTED
    │                             │
    │                             └── YES → UNTRUSTED
    │                                       Tier 1 + Tier 2 controls
    │
    └── YES → UNTRUSTED
              Tier 1 + Tier 2 controls
```

### Trust Transitivity

An agent's output inherits the trust level of its least-trusted input. If Agent A (trusted) and Agent B (untrusted) both feed into Agent C, then Agent C operates with untrusted context.

Classify each agent by its **worst-case context** in normal operation.

### Gray Zone Examples

These look trusted but are actually untrusted:

| Scenario | Hidden Untrusted Path |
|----------|----------------------|
| Agent reading your database | Customer-submitted free-text fields enter context |
| Agent processing GitHub Issues | External contributors can file issues |
| Agent summarizing Slack | Clients or vendors in shared channels |
| Agent analyzing error logs | User input in request bodies appears in stack traces |
| RAG over your docs | Corpus includes externally-sourced content |
| Agent consuming another agent's output | Upstream agent processed untrusted context |

---

## Risk Tiers

Agents are classified by the maximum impact of their actions, independent of context trust.

| Tier | Label | Description | Review Cadence |
|------|-------|-------------|----------------|
| 1 | **Observer** | Read-only, non-sensitive data | Quarterly |
| 2 | **Analyst** | Read access to sensitive data | Quarterly |
| 3 | **Writer** | Creates or modifies local files/data | Quarterly |
| 4 | **Operator** | Modifies external systems | Monthly |
| 5 | **Transactor** | Initiates financial or contractual actions | Weekly |

---

## Control Matrix

### Tier 1: Operational Controls (All Agents)

| ID | Control | Evidence Type | Applies To |
|----|---------|---------------|------------|
| AGT-01 | Agent registered in inventory | Agent registry entry | All |
| AGT-02 | Data access scope documented | Registry: data access table | All |
| AGT-03 | Tool/MCP access scope documented | Registry: tool access table | All |
| AGT-04 | Explicit boundary constraints documented | Registry: exclusions list | All |
| AGT-05 | Credentials managed in secrets manager | Credential inventory, rotation logs | All with credentials |
| AGT-06 | Least privilege enforced | IAM role/scope documentation | All with credentials |
| AGT-07 | Actions logged | Log configuration, sample logs | All |
| AGT-08 | Context sources enumerated | Registry: context sources | All |
| AGT-09 | Context trust classification assigned | Registry: trust classification | All |
| AGT-10 | Periodic access review completed | Signed review checklist | All |

### Tier 2: Adversarial Controls (Untrusted Context Only)

| ID | Control | Evidence Type | Applies To |
|----|---------|---------------|------------|
| AGT-11 | Input validation before LLM context | Validation rules, rejection logs | Untrusted |
| AGT-12 | Output filtering for sensitive data | Filter rules, blocked output logs | Untrusted |
| AGT-13 | Prompt injection defenses | System prompt hardening documentation | Untrusted |
| AGT-14 | Context isolation (untrusted separated from system instructions) | Prompt architecture documentation | Untrusted |
| AGT-15 | Rate limiting configured | Rate limit configuration | Untrusted |
| AGT-16 | Abuse monitoring active | Alert rules, incident logs | Untrusted |
| AGT-17 | Blue team testing completed | Test plan, findings, remediation | Untrusted |
| AGT-18 | Data minimization in context construction | Context construction documentation | Untrusted |
| AGT-19 | Incident response covers agent-specific scenarios | IR plan with agent sections | Untrusted |

### Blue Team Testing Protocol (Untrusted Context Only)

| Test | Description | Frequency |
|------|-------------|-----------|
| Prompt injection | Can crafted input override system instructions? | Pre-launch + quarterly |
| Data exfiltration | Can crafted input extract system prompt, credentials, or internal context? | Pre-launch + quarterly |
| Tool abuse | Can crafted input cause unintended tool invocations? | Pre-launch + quarterly |
| Context poisoning | Can adversarial content in documents influence future behavior? | Pre-launch + on pipeline changes |
| Privilege escalation | Can crafted input access data/systems beyond agent scope? | Pre-launch + quarterly |

Trusted-context agents do not require blue team testing. Operational QA (does it work correctly) still applies but is not a security control.

---

## TSC Mapping

How agent governance controls map to existing SOC 2 Trust Services Criteria:

| Agent Control | TSC Control | Relationship |
|---------------|-------------|--------------|
| AGT-01 to AGT-04 | CC5.1 (Logical Access) | Agent identity is a form of access control |
| AGT-05, AGT-06 | CC5.1, CC6.1 (Encryption/Access) | Credential management |
| AGT-07 | CC7.1 (Monitoring) | Agent audit trail |
| AGT-08, AGT-09 | CC3.1 (Risk Assessment) | Context trust is a risk classification |
| AGT-10 | CC5.1 (Access Reviews) | Periodic agent access review |
| AGT-11 to AGT-14 | CC5.2 (System Operations) | Input/output controls |
| AGT-15, AGT-16 | CC7.1 (Monitoring) | Abuse detection |
| AGT-17 | CC3.1, CC7.2 (Risk, Incident Response) | Adversarial testing |
| AGT-18 | C1.1 (Confidentiality) | Data minimization |
| AGT-19 | CC7.2 (Incident Response) | Agent-specific IR procedures |

---

## Agent Registry Schema

Each agent has a single registry entry stored as a markdown document with YAML frontmatter. The frontmatter enables the MCP server to query, filter, and report on the agent inventory programmatically.

### Frontmatter Schema

```yaml
---
id: "AGENT-001"
type: "agent-registry"
status: "active"                    # active | inactive | decommissioned
name: "Gap Assessment Agent"
purpose: "Inventory infrastructure and assess SOC 2 control compliance"
owner: "John"
risk_tier: 2                        # 1-5 per risk tier table
context_classification: "trusted"   # trusted | untrusted
control_tier: "tier-1"              # tier-1 | tier-1-plus-tier-2
created: "2026-02-21"
last_reviewed: "2026-02-21"
next_review: "2026-05-21"
blue_team_status: "n/a"             # n/a | last: YYYY-MM-DD, next: YYYY-MM-DD
tsc_controls:                       # which SOC 2 controls this agent is relevant to
  - "CC5.1"
  - "CC6.1"
  - "CC7.1"
---
```

### Body Structure

The document body uses the following sections. Each section is required.

```markdown
## Context Sources

[List every source of content that enters the LLM context for this agent]

- Source 1: description (trusted/untrusted)
- Source 2: description (trusted/untrusted)

## Untrusted Input Path

None — all context sourced from systems under org control.

OR

[Description of how external content enters the LLM context]

## Data Access

| Data Category | Scope | Classification | Access Type |
|---------------|-------|----------------|-------------|
| ... | ... | ... | Read/Write/Delete |

### Explicitly Excluded

- [Data this agent must NOT access]

## Tool Access

| MCP / Tool | Permissions | Credential Type | Credential ID |
|------------|-------------|-----------------|---------------|
| ... | ... | ... | ... |

### Explicitly Excluded

- [MCPs/tools this agent must NOT have]

## Action Permissions

| Action | Permitted | Notes |
|--------|-----------|-------|
| ... | ✅ / ❌ | ... |

## Boundary Constraints

- [Explicit prohibitions]
- [Output restrictions]
- [Credential requirements]

## Credentials

| Credential ID | Type | Created | Last Rotated | Rotation Target | Stored In |
|---------------|------|---------|-------------|-----------------|-----------|
| ... | ... | ... | ... | 90 days | ... |
```

---

## Registry Instances

### AGENT-001: Gap Assessment Agent

```yaml
---
id: "AGENT-001"
type: "agent-registry"
status: "active"
name: "Gap Assessment Agent"
purpose: "Inventory infrastructure, assess SOC 2 controls, collect evidence"
owner: "John"
risk_tier: 2
context_classification: "trusted"
control_tier: "tier-1"
created: "2026-02-21"
last_reviewed: "2026-02-21"
next_review: "2026-05-21"
blue_team_status: "n/a"
tsc_controls:
  - "CC5.1"
  - "CC6.1"
  - "CC7.1"
  - "CC3.1"
---
```

#### Context Sources

- Cloud provider APIs — org-owned infrastructure configuration (trusted)
- GitHub API — org-owned repository settings and CI config (trusted)
- Google Workspace Admin API — org-owned user directory (trusted)
- Local filesystem — compliance knowledge base files (trusted)

#### Untrusted Input Path

None — all context sourced from systems under org control.

#### Data Access

| Data Category | Scope | Classification | Access Type |
|---------------|-------|----------------|-------------|
| Cloud IAM configuration | All IAM users, roles, policies | Internal | Read |
| Cloud network configuration | VPC, security groups, firewall rules | Internal | Read |
| Cloud storage configuration | Bucket policies, encryption settings | Internal | Read |
| Cloud logging configuration | Audit log settings, log sinks | Internal | Read |
| Source control settings | Branch protection, CI config, collaborators | Internal | Read |
| Identity provider directory | User list, MFA status, login audit | Internal | Read |
| Secrets manager metadata | Secret names and rotation dates only | Sensitive | Read (metadata) |

##### Explicitly Excluded

- Secret values / credentials
- Customer or client data
- Financial data (Plaid tokens, account data)
- Email or communication content
- Production application data

#### Tool Access

| MCP / Tool | Permissions | Credential Type | Credential ID |
|------------|-------------|-----------------|---------------|
| Cloud Provider (GCP/AWS) | `viewer` / read-only role | Service account key | `cred-gcp-viewer` |
| GitHub | `read:org`, `read:repo`, `repo:status` | Scoped PAT | `cred-gh-readonly` |
| Google Workspace Admin | `admin.directory.user.readonly` | OAuth service account | `cred-gws-readonly` |
| Local Filesystem | Read: `/inventory/`, `/controls/`, `/config/`. Write: `/inventory/`, `/gaps/`, `/evidence/automated/` | Local | N/A |

##### Explicitly Excluded

- No write/modify permissions on any cloud resource
- No ability to create/delete users, repos, or infrastructure
- No access to Plaid API or any financial service
- No email, Slack, or external communication tools

#### Action Permissions

| Action | Permitted | Notes |
|--------|-----------|-------|
| Read cloud configuration | ✅ | Via read-only service account |
| Read source control settings | ✅ | Via scoped PAT |
| Write inventory files (local) | ✅ | To `/inventory/` and `/gaps/` only |
| Write evidence files (local) | ✅ | To `/evidence/automated/` only |
| Modify any cloud resource | ❌ | |
| Access production data | ❌ | |
| Access financial APIs | ❌ | |
| Communicate externally | ❌ | |
| Provision other agents | ❌ | |

#### Boundary Constraints

- CANNOT modify any infrastructure, configuration, or resource
- CANNOT access secret values, only metadata (name, rotation date)
- CANNOT access any customer/client data
- CANNOT communicate outside the local agent framework
- CANNOT create, modify, or delete credentials
- ALL outputs written to local markdown files only
- Credential rotation: every 90 days
- Review cadence: quarterly

#### Credentials

| Credential ID | Type | Created | Last Rotated | Rotation Target | Stored In |
|---------------|------|---------|-------------|-----------------|-----------|
| `cred-gcp-viewer` | GCP service account key | 2026-02-21 | 2026-02-21 | 90 days | GCP Secret Manager |
| `cred-gh-readonly` | GitHub PAT (scoped) | 2026-02-21 | 2026-02-21 | 90 days | GCP Secret Manager |
| `cred-gws-readonly` | Google Workspace OAuth | 2026-02-21 | 2026-02-21 | 90 days | GCP Secret Manager |

---

### AGENT-002: Policy Generation Agent

```yaml
---
id: "AGENT-002"
type: "agent-registry"
status: "active"
name: "Policy Generation Agent"
purpose: "Generate tailored security policies from gap assessment and environment inventory"
owner: "John"
risk_tier: 3
context_classification: "trusted"
control_tier: "tier-1"
created: "2026-02-21"
last_reviewed: "2026-02-21"
next_review: "2026-05-21"
blue_team_status: "n/a"
tsc_controls:
  - "CC1.1"
  - "CC2.1"
---
```

#### Context Sources

- Gap assessment reports — generated by AGENT-001 (trusted, upstream is trusted)
- Environment inventory — generated by AGENT-001 (trusted)
- TSC control mappings — authored internally (trusted)
- Scope configuration — authored internally (trusted)

#### Untrusted Input Path

None — all context sourced from internally-generated documents and org-authored reference material.

#### Data Access

| Data Category | Scope | Classification | Access Type |
|---------------|-------|----------------|-------------|
| Gap assessment reports | `/gaps/report.md` | Internal | Read |
| Environment inventory | `/inventory/*.md` | Internal | Read |
| TSC control mappings | `/controls/*.md` | Internal | Read |
| Scope configuration | `/config/scope.md` | Internal | Read |
| Evidence manifest | `/evidence/manifest.md` | Internal | Read/Write |

##### Explicitly Excluded

- No direct access to any cloud provider, identity provider, or source control
- No access to raw evidence artifacts (JSON exports)
- No access to credentials or secrets of any kind
- No customer or financial data

#### Tool Access

| MCP / Tool | Permissions | Credential Type | Credential ID |
|------------|-------------|-----------------|---------------|
| Local Filesystem | Read: `/gaps/`, `/inventory/`, `/controls/`, `/config/`. Write: `/policies/`, `/evidence/manifest.md` | Local | N/A |

##### Explicitly Excluded

- No cloud MCPs
- No GitHub MCP
- No identity provider MCP
- No network or external API access of any kind

#### Action Permissions

| Action | Permitted | Notes |
|--------|-----------|-------|
| Read gap reports and inventory | ✅ | Local filesystem only |
| Write policy documents | ✅ | To `/policies/` only |
| Update evidence manifest | ✅ | Append-only |
| Access any external system | ❌ | |
| Modify gap reports or inventory | ❌ | |
| Publish or distribute policies | ❌ | Human review required |

#### Boundary Constraints

- CANNOT access any external system or API
- CANNOT modify its own input data (gap reports, inventory)
- ALL policy outputs require human review before adoption
- CANNOT publish, email, or distribute any document
- Operates entirely on local filesystem
- No credentials of any kind
- Review cadence: quarterly

#### Credentials

None — this agent operates exclusively on local filesystem with no external access.

---

### AGENT-003: [Template]

```yaml
---
id: "AGENT-XXX"
type: "agent-registry"
status: "active"
name: "[Agent Name]"
purpose: "[What this agent does]"
owner: "[Human principal]"
risk_tier: 0           # 1-5
context_classification: "trusted"  # trusted | untrusted
control_tier: "tier-1"             # tier-1 | tier-1-plus-tier-2
created: "YYYY-MM-DD"
last_reviewed: "YYYY-MM-DD"
next_review: "YYYY-MM-DD"
blue_team_status: "n/a"           # n/a | last: YYYY-MM-DD, next: YYYY-MM-DD
tsc_controls: []
---
```

#### Context Sources

- [Source]: [description] (trusted/untrusted)

#### Untrusted Input Path

None / [Description of external content path]

#### Data Access

| Data Category | Scope | Classification | Access Type |
|---------------|-------|----------------|-------------|

##### Explicitly Excluded

-

#### Tool Access

| MCP / Tool | Permissions | Credential Type | Credential ID |
|------------|-------------|-----------------|---------------|

##### Explicitly Excluded

-

#### Action Permissions

| Action | Permitted | Notes |
|--------|-----------|-------|

#### Boundary Constraints

-

#### Credentials

| Credential ID | Type | Created | Last Rotated | Rotation Target | Stored In |
|---------------|------|---------|-------------|-----------------|-----------|

---

## Data Classification Reference

| Classification | Definition | Agent Access Rules |
|----------------|------------|--------------------|
| **Public** | Published or intended for public consumption | Any agent, no restrictions |
| **Internal** | Business operational data, not public | Agents with documented business need, logged |
| **Sensitive** | Data requiring protection (PII, API metadata) | Named agents only, scoped access, audit trail |
| **Critical** | Highest protection (financial data, credential values) | Minimal agents, per-access logging, human approval for new grants |

---

## Access Change Log

| Date | Agent ID | Change | Reason | Approved By |
|------|----------|--------|--------|-------------|
| 2026-02-21 | AGENT-001 | Initial provisioning | SOC 2 compliance project | John |
| 2026-02-21 | AGENT-002 | Initial provisioning | SOC 2 compliance project | John |

---

## Quarterly Review Template

### Agent Inventory

- [ ] All active agents listed in registry
- [ ] No unregistered agents running
- [ ] Each agent's purpose still valid
- [ ] Decommissioned agents fully de-provisioned

### Access Verification

- [ ] Each agent's data access appropriate for purpose
- [ ] Each agent's MCP/tool access matches documentation
- [ ] No accumulated permissions beyond registry
- [ ] All explicit exclusions verified

### Credential Verification

- [ ] All credentials within rotation targets
- [ ] No credentials exposed or compromised
- [ ] No unused credentials remain active
- [ ] All credential locations match documentation

### Context Trust Verification

- [ ] Context classifications still accurate
- [ ] No new untrusted input paths introduced
- [ ] Trust transitivity verified for agent chains
- [ ] Gray zone scenarios reviewed

### Boundary Testing (sample checks)

- [ ] Trusted agents cannot reach untrusted data paths
- [ ] No agent can access Critical data without logging
- [ ] Output logs reviewed for unexpected actions

### Blue Team Status (untrusted agents only)

- [ ] Testing schedule current
- [ ] Open findings tracked and remediated
- [ ] New untrusted agents tested before launch

### Sign-Off

| Reviewer | Date | Findings | Actions |
|----------|------|----------|---------|
| | | | |

---

## Implementation Notes

### MCP Server Integration

This framework extends the existing SOC 2 compliance MCP server. The agent registry documents use the same `create_document` / `read_document` / `update_document` tools with `type: "agent-registry"`. The frontmatter schema enables:

- `list_documents` with type filter `agent-registry` returns the full agent inventory
- `list_documents` with status filter surfaces active vs decommissioned agents
- The `context_classification` and `risk_tier` frontmatter fields support dashboard and gap analysis reporting

### Suggested MCP Tool Extensions

| Tool | Description |
|------|-------------|
| `list_agents` | List agents filtered by status, context classification, risk tier |
| `get_agent_coverage` | Coverage summary: how many agents registered, classified, reviewed |
| `check_credential_rotation` | Flag credentials past rotation target |
| `run_agent_audit` | Compare registry entries against actual MCP configs for drift |

### Filesystem Layout

Agent registry documents live alongside existing compliance documents:

```
compliance/
├── controls/
│   ├── tsc-security.md
│   ├── tsc-confidentiality.md
│   └── agent-controls.md          ← AGT-01 through AGT-19
├── config/
│   └── scope.md
├── policies/
│   ├── POL-001-information-security.md
│   ├── ...
│   └── POL-013-agent-governance.md ← NEW: agent governance policy
├── evidence/
│   ├── automated/
│   ├── manual/
│   └── manifest.md
├── agents/                         ← NEW: agent registry
│   ├── AGENT-001-gap-assessment.md
│   ├── AGENT-002-policy-generation.md
│   └── AGENT-003-template.md
├── gaps/
└── assessments/
```

### Auto-Generation from MCP Config

The agent registry can be generated from the MCP configuration that provisions each agent. The flow:

```
MCP config (source of truth)
    → registry generator reads tool definitions and credential references
    → produces agent registry markdown with frontmatter
    → human reviews context classification and boundary constraints
    → approved registry entry stored in compliance/agents/
    → quarterly audit compares: MCP config ↔ registry ↔ actual permissions
```

This ensures the registry reflects reality and that drift between documentation and actual agent access is caught automatically.
