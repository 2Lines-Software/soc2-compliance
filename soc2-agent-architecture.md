# SOC 2 Compliance Agent System — Architecture & Implementation Guide

## Overview

A two-agent system built on an existing markdown-based agent framework with MCP integrations. The **Gap Assessment Agent** inventories your environment, maps findings against SOC 2 Trust Services Criteria (TSC), collects evidence, and produces a prioritized remediation plan. The **Policy Generation Agent** consumes the gap report and generates tailored, auditor-ready policies.

Both agents operate on a shared markdown knowledge base and communicate through structured documents.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   KNOWLEDGE BASE (md)                    │
│                                                          │
│  /controls/         - SOC 2 TSC control mappings         │
│  /inventory/        - Discovered environment state       │
│  /evidence/         - Collected proof artifacts          │
│  /gaps/             - Gap analysis results               │
│  /policies/         - Generated policy documents         │
│  /config/           - Agent config & scope definition    │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
    ┌──────▼──────┐               ┌───────▼──────┐
    │  GAP ASSESS │               │   POLICY GEN │
    │    AGENT    │──────────────▶│    AGENT     │
    └──────┬──────┘  gap report   └──────────────┘
           │           triggers
    ┌──────▼──────────────────────────────────────┐
    │              MCP LAYER                       │
    │                                              │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
    │  │ Cloud    │ │ Identity │ │ Source Code  │ │
    │  │ Provider │ │ Provider │ │ & CI/CD      │ │
    │  │ MCP      │ │ MCP      │ │ MCP          │ │
    │  └──────────┘ └──────────┘ └──────────────┘ │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
    │  │ Endpoint │ │ Logging  │ │ Filesystem   │ │
    │  │ MDM MCP  │ │ & SIEM   │ │ & Secrets    │ │
    │  │          │ │ MCP      │ │ MCP          │ │
    │  └──────────┘ └──────────┘ └──────────────┘ │
    └─────────────────────────────────────────────┘
```

---

## Part 1: Control Mapping Reference

Before either agent runs, the knowledge base needs a canonical mapping of SOC 2 controls. This is the "checklist" both agents work against. Structure it as markdown files under `/controls/`.

### `/controls/tsc-security.md` (example structure)

```markdown
# TSC: Security (Common Criteria — CC)

## CC1 — Control Environment

### CC1.1 — Organization and Management
- **What the auditor looks for**: Defined organizational structure, roles,
  responsibilities for security. Board/management oversight of security program.
- **Evidence types**: Org chart, role descriptions, security committee minutes
- **Typical controls**:
  - Documented security roles and responsibilities
  - Regular security program reviews by management
  - Security awareness program
- **Solo-company note**: For a 1-person org, this simplifies to: you are the
  security owner, document that fact, and maintain a cadence of self-review.

### CC1.2 — Board of Directors
- **Solo-company note**: N/A or satisfied by documenting that the principal
  serves as both management and governance.

## CC2 — Communication and Information

### CC2.1 — Internal Communication
- **What the auditor looks for**: Policies communicated to all personnel.
- **Evidence types**: Policy acknowledgment records, training completion logs
- **Typical controls**:
  - Security policy distribution and acknowledgment
  - Security awareness training (annual minimum)

## CC3 — Risk Assessment

### CC3.1 — Risk Identification
- **What the auditor looks for**: Formal risk assessment process
- **Evidence types**: Risk register, risk assessment methodology document
- **Typical controls**:
  - Annual risk assessment
  - Documented risk appetite/tolerance
  - Risk treatment plans

## CC5 — Control Activities

### CC5.1 — Logical Access Controls
- **What the auditor looks for**: Access restricted to authorized users
- **Evidence types**: User access lists, MFA config, RBAC policies
- **MCP discovery targets**: Identity provider config, cloud IAM policies

### CC5.2 — System Operations Controls
- **What the auditor looks for**: Change management, incident response
- **Evidence types**: CI/CD pipeline config, PR review requirements,
  incident response plan
- **MCP discovery targets**: GitHub/GitLab branch protection rules,
  deployment pipeline config

## CC6 — Logical and Physical Access Controls

### CC6.1 — Encryption
- **What the auditor looks for**: Data encrypted at rest and in transit
- **Evidence types**: TLS config, disk encryption settings, KMS config
- **MCP discovery targets**: Cloud storage encryption settings,
  load balancer TLS config, database encryption

### CC6.6 — System Boundaries
- **What the auditor looks for**: Network segmentation, firewalls
- **Evidence types**: Security group rules, network ACLs, VPC config
- **MCP discovery targets**: Cloud VPC/security group configs

## CC7 — System Operations

### CC7.1 — Monitoring
- **What the auditor looks for**: Detection of anomalies, security events
- **Evidence types**: Monitoring tool config, alert rules, SIEM dashboards
- **MCP discovery targets**: CloudWatch/Stackdriver alerts, log aggregation

### CC7.2 — Incident Response
- **What the auditor looks for**: Documented IR plan, tested procedures
- **Evidence types**: IR plan document, post-incident reviews, tabletop logs

## CC8 — Change Management

### CC8.1 — Change Control Process
- **What the auditor looks for**: Formal change approval, testing before deploy
- **Evidence types**: PR merge requirements, CI test gates, deploy logs
- **MCP discovery targets**: GitHub branch protection, CI/CD pipeline config

## CC9 — Risk Mitigation

### CC9.1 — Vendor Management
- **What the auditor looks for**: Third-party risk assessment
- **Evidence types**: Vendor inventory, risk assessments, BAAs/DPAs
```

Create similar files for the other TSC criteria you're scoping in (Availability, Confidentiality, Processing Integrity, Privacy). For the Plaid use case, **Security** is mandatory. **Confidentiality** and **Privacy** are strongly recommended given you're handling financial data.

---

## Part 2: Gap Assessment Agent

### Purpose

Automatically inventory the target environment, compare findings against TSC controls, collect evidence where controls exist, and produce a structured gap report with remediation priorities.

### Agent Configuration — `/config/scope.md`

```markdown
# Assessment Scope

## Organization
- **Company**: 2 Lines Software Corporation
- **Personnel count**: 1 (principal only)
- **Assessment date**: {{date}}
- **Target frameworks**: SOC 2 Type I
- **TSC in scope**: Security, Confidentiality, Privacy

## Environment Targets
- **Cloud providers**: [AWS / GCP / Azure — specify accounts]
- **Identity provider**: [Google Workspace / Okta / etc.]
- **Source control**: [GitHub org/repos]
- **CI/CD**: [GitHub Actions / etc.]
- **Infrastructure**: [list services — e.g., GKE, Cloud SQL, Cloud Run]
- **Endpoint devices**: [MacBook Pro — specify]
- **Key SaaS tools**: [list — Plaid, Stripe, etc.]
- **Secrets management**: [Vault / AWS SM / GCP SM / env vars]
- **Logging**: [CloudWatch / Stackdriver / etc.]

## Data Classification
- **Critical**: Financial data from Plaid API (access tokens, account data)
- **Sensitive**: Client information, API credentials
- **Internal**: Business documents, code
- **Public**: Marketing materials, open-source code
```

### Agent Workflow

The gap agent runs a **four-phase pipeline**. Each phase produces markdown output that feeds the next.

```
Phase 1: DISCOVER  →  Phase 2: MAP  →  Phase 3: ASSESS  →  Phase 4: REPORT
(inventory env)       (match to TSC)    (score gaps)        (prioritize)
     │                     │                 │                    │
     ▼                     ▼                 ▼                    ▼
 /inventory/          /inventory/         /gaps/              /gaps/
   *.md              *-mapped.md         scores.md           report.md
```

### Phase 1: DISCOVER — Environment Inventory

The agent calls each configured MCP to pull current state. Each MCP probe writes a structured markdown file.

#### MCP Integration Specifications

**Cloud Provider MCP** (e.g., AWS or GCP)

| Probe | What It Collects | TSC Mapping |
|-------|-----------------|-------------|
| `iam_users_and_roles` | IAM users, roles, policies, MFA status | CC5.1, CC6.1 |
| `encryption_config` | KMS keys, storage encryption, TLS certs | CC6.1 |
| `network_config` | VPCs, security groups, firewall rules | CC6.6 |
| `logging_config` | CloudTrail/Audit Log status, log sinks | CC7.1 |
| `storage_config` | Bucket policies, public access settings | CC6.1, CC6.6 |
| `compute_config` | Instance metadata, patch status, OS versions | CC7.1 |
| `backup_config` | Snapshot schedules, retention policies | CC7.1 |

Output example — `/inventory/cloud-iam.md`:

```markdown
# Cloud IAM Inventory — {{provider}} — {{date}}

## Users
| User | MFA Enabled | Last Login | Roles | Access Keys |
|------|-------------|------------|-------|-------------|
| john@2lines.ca | ✅ | 2026-02-20 | Owner | 1 (rotated 2026-01-15) |

## Service Accounts
| Account | Purpose | Key Age | Scopes |
|---------|---------|---------|--------|
| plaid-connector@proj.iam | Plaid API integration | 45 days | storage.read |

## Policies
- [x] No wildcard IAM policies found
- [x] No public access grants found
- [ ] ⚠️ Service account key older than 90 days: deploy-sa@proj.iam (142 days)

## Evidence Artifacts
- `evidence/cloud-iam-export-2026-02-21.json`
- `evidence/mfa-status-2026-02-21.json`
```

**Identity Provider MCP** (Google Workspace / Okta)

| Probe | What It Collects | TSC Mapping |
|-------|-----------------|-------------|
| `user_directory` | Users, groups, roles, suspended accounts | CC5.1 |
| `mfa_status` | MFA enrollment, methods, enforcement policies | CC5.1, CC6.1 |
| `app_access` | OAuth grants, third-party app access | CC6.6 |
| `login_audit` | Recent login events, suspicious activity | CC7.1 |
| `password_policy` | Complexity, rotation, lockout settings | CC5.1 |

**Source Code & CI/CD MCP** (GitHub)

| Probe | What It Collects | TSC Mapping |
|-------|-----------------|-------------|
| `repo_settings` | Branch protection, required reviews, CODEOWNERS | CC8.1 |
| `ci_pipeline` | Test stages, gates, deployment approval | CC8.1 |
| `secrets_scan` | Secret scanning alerts, Dependabot status | CC5.2, CC7.1 |
| `access_audit` | Collaborators, deploy keys, webhook config | CC5.1, CC6.6 |
| `dependency_audit` | Known vulnerabilities in dependencies | CC7.1 |

**Endpoint / MDM MCP** (Kandji / Jamf / manual)

| Probe | What It Collects | TSC Mapping |
|-------|-----------------|-------------|
| `device_inventory` | Devices, OS version, encryption status | CC6.1 |
| `security_config` | Firewall, auto-updates, screen lock | CC5.1, CC6.1 |
| `software_inventory` | Installed apps, versions | CC7.1 |

**Filesystem & Secrets MCP**

| Probe | What It Collects | TSC Mapping |
|-------|-----------------|-------------|
| `secrets_manager` | Stored secrets (names only), rotation dates | CC6.1 |
| `env_scan` | .env files, hardcoded credentials in repos | CC5.2 |

#### Solo-Company Optimization

For a one-person operation, some MCPs can be simplified or replaced with self-attestation prompts. The agent should detect the personnel count from scope config and adjust:

```markdown
<!-- Agent logic pseudocode -->
if personnel_count == 1:
  - Skip: user access review workflows (no other users)
  - Skip: separation of duties checks (document compensating controls instead)
  - Simplify: change management = PR self-review + CI gates
  - Add: compensating control documentation for single-person risks
  - Flag: auditor will want to see automated controls compensating
          for lack of segregation of duties
```

### Phase 2: MAP — Control Matching

The agent reads each inventory file and matches findings to the TSC control reference. It annotates the inventory files with control mappings:

```markdown
# Mapping: cloud-iam → TSC Controls

| Finding | Control | Status | Evidence |
|---------|---------|--------|----------|
| MFA enabled for all users | CC5.1 | ✅ PASS | cloud-iam-export.json |
| No wildcard IAM policies | CC5.1 | ✅ PASS | iam-policy-export.json |
| Service account key > 90d | CC5.1 | ⚠️ FAIL | sa-key-ages.json |
| KMS encryption on all buckets | CC6.1 | ✅ PASS | storage-config.json |
| CloudTrail enabled all regions | CC7.1 | ✅ PASS | cloudtrail-config.json |
| No VPC flow logs configured | CC7.1 | ❌ FAIL | vpc-config.json |
```

### Phase 3: ASSESS — Gap Scoring

The agent aggregates all mappings and scores each control area. Scoring model:

| Score | Meaning | Remediation Priority |
|-------|---------|---------------------|
| 3 — Fully Met | Control exists, evidence collected, operating effectively | None |
| 2 — Partially Met | Control exists but incomplete or not fully evidenced | Medium |
| 1 — Not Met | Control missing or fundamentally inadequate | High |
| 0 — Not Assessed | Out of scope or MCP not available | Review scope |

### Phase 4: REPORT — Gap Analysis Output

`/gaps/report.md` — the primary output document:

```markdown
# SOC 2 Gap Assessment Report
**Company**: 2 Lines Software Corporation
**Date**: {{date}}
**Scope**: SOC 2 Type I — Security, Confidentiality, Privacy
**Assessed by**: Compliance Agent v1.0

## Executive Summary
- **Controls assessed**: 47
- **Fully met**: 38 (81%)
- **Partially met**: 6 (13%)
- **Not met**: 3 (6%)
- **Estimated remediation effort**: 15–20 hours
- **Audit readiness**: Medium-High (address critical gaps first)

## Critical Gaps (Must Fix)

### GAP-001: No documented Information Security Policy
- **Control**: CC1.1, CC2.1
- **Current state**: No formal policy document exists
- **Risk**: Auditor will flag as foundational deficiency
- **Remediation**: Generate using Policy Agent (est. 2 hrs review)
- **Priority**: 🔴 Critical

### GAP-002: VPC Flow Logs not enabled
- **Control**: CC7.1
- **Current state**: Flow logs disabled on primary VPC
- **Risk**: Cannot demonstrate network monitoring
- **Remediation**: Enable flow logs, configure log sink (est. 30 min)
- **Evidence needed**: Flow log config screenshot, log sink config
- **Priority**: 🔴 Critical

### GAP-003: No formal incident response plan
- **Control**: CC7.2
- **Current state**: No IR document exists
- **Risk**: Required for SOC 2; auditor will flag
- **Remediation**: Generate using Policy Agent (est. 1 hr review)
- **Priority**: 🔴 Critical

## Medium Gaps (Should Fix)

### GAP-004: Service account key rotation overdue
- **Control**: CC5.1
- **Current state**: deploy-sa key is 142 days old (target: 90 days)
- **Remediation**: Rotate key, implement rotation reminder
- **Priority**: 🟡 Medium

[... additional gaps ...]

## Controls Fully Met (Evidence Collected)
| Control | Description | Evidence Location |
|---------|-------------|-------------------|
| CC5.1-MFA | MFA on all accounts | evidence/mfa-status.json |
| CC6.1-ENC | Encryption at rest | evidence/storage-config.json |
| CC8.1-PR | PR reviews required | evidence/branch-protection.json |
[...]

## Remediation Roadmap
| Week | Action | Gaps Addressed | Effort |
|------|--------|---------------|--------|
| 1 | Generate & review policies | GAP-001, GAP-003, GAP-006 | 8 hrs |
| 1 | Enable VPC flow logs | GAP-002 | 0.5 hrs |
| 2 | Rotate service account keys | GAP-004 | 1 hr |
| 2 | Configure automated backups | GAP-005 | 2 hrs |
| 3 | Final evidence collection pass | All | 4 hrs |
```

---

## Part 3: Policy Generation Agent

### Purpose

Consume the gap report and environment inventory to generate tailored, auditor-ready security policies. Not generic templates — policies that reference your actual tools, configurations, and organizational structure.

### Agent Workflow

```
Gap Report + Inventory + Scope Config
            │
            ▼
    ┌───────────────┐
    │ POLICY AGENT  │
    │               │
    │ 1. Parse gaps  │
    │    needing     │
    │    policies    │
    │               │
    │ 2. Load TSC    │
    │    requirements│
    │               │
    │ 3. Load env    │
    │    inventory   │
    │    for context │
    │               │
    │ 4. Generate    │
    │    tailored    │
    │    policy docs │
    │               │
    │ 5. Cross-ref   │
    │    policy ↔    │
    │    controls    │
    └───────┬───────┘
            │
            ▼
    /policies/*.md
```

### Policy Document Structure

Each policy follows a consistent structure that auditors expect:

```markdown
# [Policy Name]

**Document ID**: POL-XXX
**Version**: 1.0
**Effective Date**: {{date}}
**Owner**: {{name}}, Principal — 2 Lines Software Corporation
**Review Cadence**: Annual (next review: {{date + 1 year}})
**Applicable TSC**: {{list of TSC controls this satisfies}}

## 1. Purpose
[Why this policy exists — 2-3 sentences]

## 2. Scope
[What systems, data, and personnel this covers]

## 3. Policy Statements
[The actual rules — specific, measurable, tied to your environment]

## 4. Procedures
[How the policy is implemented — reference actual tools]

## 5. Exceptions
[Process for requesting exceptions]

## 6. Enforcement
[What happens on violation]

## 7. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{date}} | {{name}} | Initial release |
```

### Core Policy Set (Minimum Viable for SOC 2)

The agent generates these policies, each tailored to the discovered environment:

| Policy | TSC Controls | Key Tailoring Points |
|--------|-------------|---------------------|
| **Information Security Policy** | CC1.1, CC2.1 | Org structure, security roles (solo-adapted) |
| **Access Control Policy** | CC5.1, CC6.1 | Your specific IdP, MFA config, cloud IAM model |
| **Encryption Policy** | CC6.1 | Your actual KMS, TLS config, storage encryption |
| **Change Management Policy** | CC8.1 | Your GitHub workflow, CI/CD pipeline, review process |
| **Incident Response Plan** | CC7.2 | Your monitoring tools, escalation (solo-adapted) |
| **Risk Assessment Policy** | CC3.1 | Your risk methodology, assessment cadence |
| **Vendor Management Policy** | CC9.1 | Your actual vendor list (Plaid, cloud providers, etc.) |
| **Data Classification Policy** | CC6.1, Privacy | Your data types per scope config |
| **Acceptable Use Policy** | CC1.1 | Device and network usage (solo-adapted) |
| **Business Continuity / DR Policy** | CC7.1 | Your backup config, recovery targets |
| **Data Retention & Disposal Policy** | Privacy | Plaid data handling, retention periods |
| **Logging & Monitoring Policy** | CC7.1 | Your actual log pipeline, alert rules |

### Tailoring Logic: Solo-Company Adaptations

The policy agent should apply specific logic for one-person organizations. This is the key differentiator vs. generic templates:

```markdown
## Solo-Company Policy Adaptations

### Separation of Duties
- Standard control: Different people approve and deploy changes
- Solo adaptation: Automated CI gates serve as the "second reviewer"
  - PR must pass CI checks before merge
  - Deploy requires passing test suite
  - Document this as a compensating control

### Access Reviews
- Standard control: Quarterly access reviews by manager
- Solo adaptation: Quarterly self-review checklist
  - Review all cloud IAM grants
  - Review all OAuth app authorizations
  - Review all API keys and rotation dates
  - Document review in /evidence/access-review-{{quarter}}.md

### Security Awareness Training
- Standard control: Annual training for all employees
- Solo adaptation: Self-directed annual review
  - Review OWASP Top 10 updates
  - Review relevant breach reports
  - Document completion in /evidence/training-{{year}}.md

### Incident Escalation
- Standard control: Escalation chain within organization
- Solo adaptation: External escalation contacts
  - Legal counsel: [name/firm]
  - Cyber insurance provider: [if applicable]
  - Plaid security contact: security@plaid.com
  - Affected client notification process
```

---

## Part 4: Evidence Collection (Integrated with Gap Agent)

Evidence collection runs as part of the gap assessment but deserves its own structure since it produces the artifacts an auditor will actually examine.

### Evidence Directory Structure

```
/evidence/
├── automated/              # MCP-collected, timestamped
│   ├── cloud-iam/
│   │   ├── 2026-02-21-iam-users.json
│   │   ├── 2026-02-21-mfa-status.json
│   │   └── 2026-02-21-iam-policies.json
│   ├── cloud-network/
│   ├── cloud-encryption/
│   ├── github/
│   │   ├── 2026-02-21-branch-protection.json
│   │   └── 2026-02-21-ci-pipeline.yaml
│   ├── identity-provider/
│   └── endpoint/
├── manual/                 # Self-attestation, screenshots
│   ├── device-encryption-screenshot.png
│   ├── training-completion-2026.md
│   └── risk-assessment-2026.md
├── policies/               # Signed/acknowledged policies
│   └── ack-info-security-policy-2026-02-21.md
├── reviews/                # Periodic review records
│   ├── access-review-2026-Q1.md
│   └── vendor-review-2026-Q1.md
└── manifest.md             # Index mapping evidence → controls
```

### Evidence Manifest — `/evidence/manifest.md`

```markdown
# Evidence Manifest

| Control | Evidence File | Collection Method | Date | Status |
|---------|--------------|-------------------|------|--------|
| CC5.1 | automated/cloud-iam/mfa-status.json | MCP: cloud | 2026-02-21 | ✅ |
| CC5.1 | automated/github/branch-protection.json | MCP: github | 2026-02-21 | ✅ |
| CC6.1 | automated/cloud-encryption/kms-config.json | MCP: cloud | 2026-02-21 | ✅ |
| CC7.2 | policies/incident-response-plan.md | Policy Agent | 2026-02-21 | ✅ |
| CC1.1 | manual/training-completion-2026.md | Self-attestation | — | ⏳ |
```

### Continuous Collection Schedule

For SOC 2 Type II readiness (when you're ready to graduate from Type I), the agent should support scheduled collection:

```markdown
# Collection Schedule

| Frequency | What | MCP |
|-----------|------|-----|
| Daily | Cloud audit logs (summary) | cloud |
| Weekly | GitHub activity (merges, deploys) | github |
| Weekly | Login audit events | identity |
| Monthly | Full IAM snapshot | cloud |
| Monthly | Dependency vulnerability scan | github |
| Quarterly | Access review | semi-automated + manual |
| Quarterly | Vendor risk review | manual |
| Annually | Full risk assessment | manual |
| Annually | Policy review & update | policy agent |
| Annually | Security training completion | manual |
```

---

## Part 5: MCP Implementation Priority

Given this is for a solo consultancy, here's the practical build order:

### Phase 1 — Core (Week 1-2)
Build or adapt these MCPs first. They cover ~70% of the automated evidence.

1. **Cloud Provider MCP** (highest value)
   - IAM users, roles, MFA status
   - Storage encryption config
   - Network/firewall rules
   - Logging/audit config
   - Most cloud providers have comprehensive APIs

2. **GitHub MCP** (you likely have this already)
   - Branch protection rules
   - CI/CD pipeline config
   - Collaborator access
   - Secret scanning status
   - Dependabot alerts

### Phase 2 — Extended (Week 3-4)
3. **Identity Provider MCP**
   - Google Workspace Admin SDK or Okta API
   - User directory, MFA enrollment, login audit

4. **Secrets Manager MCP**
   - List secrets (names only), rotation dates
   - Scan for .env files in repos

### Phase 3 — Nice to Have (Week 5+)
5. **Endpoint MCP** (hardest for solo, lowest ROI)
   - Can often replace with a manual self-attestation template
   - If using Kandji/Jamf, API is straightforward

6. **Vendor Inventory MCP**
   - Lightweight — could just be a structured md file
   - Enriched with web search for vendor SOC 2 reports

---

## Part 6: Agent Prompt Architecture

### Gap Assessment Agent — System Prompt Skeleton

```
You are a SOC 2 compliance assessor for small technology companies.

Your knowledge base contains:
- SOC 2 Trust Services Criteria mappings in /controls/
- Assessment scope configuration in /config/scope.md
- Environment inventory data collected via MCPs in /inventory/

Your workflow:
1. Read /config/scope.md to understand the assessment scope
2. For each MCP configured in scope, run discovery probes
3. Write structured inventory files to /inventory/
4. Map each finding to TSC controls per /controls/ reference
5. Score each control (0-3 scale)
6. Collect evidence artifacts for passing controls
7. Flag gaps for failing/partial controls
8. Produce the gap report at /gaps/report.md

Rules:
- Always note when a control is adapted for solo-company context
- Always specify the evidence file path for passing controls
- For gaps, always include: current state, risk, remediation steps, effort estimate
- Flag compensating controls where separation of duties cannot be met
- Be specific to the discovered environment, never generic
```

### Policy Generation Agent — System Prompt Skeleton

```
You are a security policy author for small technology companies pursuing
SOC 2 compliance.

Your inputs:
- Gap report at /gaps/report.md (identifies which policies are needed)
- Environment inventory at /inventory/ (provides specific tool/config context)
- Scope config at /config/scope.md (company details)
- TSC control mappings at /controls/ (what each policy must satisfy)

Your workflow:
1. Read the gap report to identify policies flagged as missing
2. For each needed policy, read the relevant TSC control requirements
3. Read the relevant inventory files for environmental context
4. Generate the policy using the standard template structure
5. Tailor all procedural sections to reference actual tools and configs
6. Apply solo-company adaptations where relevant
7. Output to /policies/[policy-name].md
8. Update /evidence/manifest.md with the new policy as evidence

Rules:
- Policies must be specific, not generic. Reference actual tool names,
  actual configurations, actual cloud services.
- Every policy statement must map to at least one TSC control
- Use plain, direct language. Avoid compliance jargon where possible.
- Include solo-company compensating controls where separation of duties
  or multi-person review would normally be required
- Each policy must include a revision history and review cadence
- Policies should be concise (aim for 2-4 pages, not 20)
```

---

## Part 7: Commercialization Notes

This system has clear product potential beyond your own compliance needs:

### Target Markets
1. **Solo consultants / freelancers** accessing financial APIs (Plaid, Stripe Connect, etc.)
2. **Micro-SaaS** (1-10 person) companies getting their first SOC 2
3. **1864 Ventures portfolio companies** as a value-add service
4. **AI Tinkerers community** members building fintech tools

### Differentiators vs. Existing Platforms
- **Price point**: $0 for self-hosted tooling vs. $10K+/yr for Vanta
- **Solo-company native**: Every template and workflow designed for 1-5 person orgs, not adapted down from enterprise
- **Agent-native**: Built on AI agents, not a SaaS dashboard with AI bolted on
- **Markdown-native**: Version-controlled, portable, no vendor lock-in
- **MCP architecture**: Extensible to any tool via standard MCP pattern

### Packaging Options
- **Open-source agent + control mappings**: Community building, thought leadership
- **Managed compliance service**: You run the agents for clients, review output, deliver policies (Capability Sprint model)
- **Plaid-specific compliance kit**: Narrowly scoped to passing the Plaid security questionnaire — could be a quick-win product

---

## Appendix: Plaid Security Questionnaire Mapping

Direct mapping of Plaid's v6 security questionnaire to the agent's control areas:

| Plaid Question Area | Agent Control Area | MCP Source |
|--------------------|--------------------|------------|
| Documented infosec policy | CC1.1 → Policy Agent | Generated |
| Network endpoint visibility | CC6.6 → Cloud MCP | cloud, endpoint |
| MFA on production assets | CC5.1 → Identity MCP | identity, cloud |
| Encryption at rest & in transit | CC6.1 → Cloud MCP | cloud |
| Audit trails for production | CC7.1 → Cloud MCP | cloud, logging |
| Monitoring & alerting | CC7.1 → Cloud MCP | cloud, logging |
| Code review & change mgmt | CC8.1 → GitHub MCP | github |
| Access control processes | CC5.1 → Identity MCP | identity, cloud |
| Personal device controls | CC5.1 → Endpoint MCP | endpoint |
| Employee security training | CC2.1 → Manual | self-attestation |
| Incident response process | CC7.2 → Policy Agent | Generated |
