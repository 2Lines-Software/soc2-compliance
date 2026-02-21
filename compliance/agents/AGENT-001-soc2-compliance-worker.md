---
id: "AGENT-001"
type: "agent-registry"
status: "active"
name: "SOC 2 Compliance Worker"
purpose: "Automate SOC 2 compliance lifecycle — gap analysis, policy generation, evidence collection, and audit readiness checks"
owner: "John"
risk_tier: 3
context_classification: "trusted"
control_tier: "tier-1"
created: "2026-02-21"
last_reviewed: "2026-02-21"
next_review: "2026-05-21"
blue_team_status: "n/a"
tsc_controls:
  - "CC5.1"
  - "CC7.1"
  - "CC3.1"
---

# SOC 2 Compliance Worker

## Context Sources

- Local compliance knowledge base: Markdown files in `compliance/` (trusted)
- User prompts: Direct input from company owner via Claude Code CLI (trusted)
- Policy templates: Static templates in `templates/` (trusted)
- Infrastructure MCPs (optional): GitHub, AWS/GCP, Google Workspace — org-controlled systems (trusted)

## Untrusted Input Path

None — all context sourced from systems under org control. The agent reads compliance documents, control mappings, and policy templates authored internally. User input comes from the authenticated company owner.

**Note**: If infrastructure MCPs are connected to repos with external contributors (e.g., public GitHub Issues, external PRs), re-evaluate this classification. External contributor content reaching the LLM context would reclassify this agent as untrusted.

## Data Access

| Data Category | Scope | Classification | Access Type |
|---------------|-------|----------------|-------------|
| Control mappings | CC1-CC9, C1, AGT-01-19 | Internal | Read |
| Company config | Scope, environment, stack | Internal | Read/Write |
| Policies | All generated policies | Internal | Read/Write |
| Evidence | All evidence artifacts | Internal/Confidential | Read/Write |
| Gap reports | Assessment findings | Internal | Read/Write |
| Readiness assessments | Audit readiness checks | Internal | Read/Write |
| Agent registry | Agent governance entries | Internal | Read/Write |

### Explicitly Excluded

- Production databases and application data
- Customer PII or financial records
- Cloud provider credentials or secrets (reads names only via Secrets Manager MCP)
- Source code (reads CI/CD config only via GitHub MCP)

## Tool Access

| MCP / Tool | Permissions | Credential Type | Credential ID |
|------------|-------------|-----------------|---------------|
| soc2-compliance (local) | All 22 tools | None (local stdio) | N/A |
| GitHub MCP (optional) | Read-only: repos, branch protection, collaborators, secret scanning | OAuth token | gh-compliance-ro |
| AWS MCP (optional) | Read-only: IAM, CloudTrail, encryption config | IAM role | aws-compliance-ro |
| Google Workspace MCP (optional) | Read-only: directory, MFA status, login audit | Service account | gws-compliance-ro |

### Explicitly Excluded

- Write access to any infrastructure MCP (GitHub, AWS, GCP, IdP)
- Direct database connections
- Email or messaging MCPs (no ability to send communications)
- Payment or billing MCPs

## Action Permissions

| Action | Permitted | Notes |
|--------|-----------|-------|
| Read compliance documents | ✅ | Controls, policies, evidence, config |
| Create/update compliance documents | ✅ | Policies, evidence, gap reports, assessments |
| Read infrastructure config (via MCP) | ✅ | When infrastructure MCPs are connected |
| Modify infrastructure | ❌ | All infrastructure MCPs are read-only |
| Send external communications | ❌ | No email, Slack, or notification access |
| Access production data | ❌ | Only compliance metadata |
| Delete compliance documents | ❌ | Documents follow lifecycle (draft → expired), never deleted |

## Boundary Constraints

- CANNOT modify any infrastructure, cloud resources, or external systems
- CANNOT access production databases or application data
- CANNOT send emails, messages, or external notifications
- CANNOT delete compliance documents (lifecycle management only)
- CANNOT access or store secrets (reads secret names only for inventory)
- CANNOT push code or create pull requests
- CAN ONLY write to the `compliance/` directory and evidence store
- All outputs are local markdown files versioned in git

## Credentials

| Credential ID | Type | Created | Last Rotated | Rotation Target | Stored In |
|---------------|------|---------|-------------|-----------------|-----------|
| N/A (local) | stdio | 2026-02-21 | N/A | N/A | Local process |
| gh-compliance-ro | OAuth token | — | — | 90 days | GitHub App / secrets manager |
| aws-compliance-ro | IAM role | — | — | 90 days | AWS IAM |
| gws-compliance-ro | Service account key | — | — | 90 days | Secrets manager |

**Note**: Infrastructure MCP credentials are optional. The agent functions fully without them — it prompts the user for manual attestations instead.
