---
name: compliance-policy
description: Generate tailored, auditor-ready security policies based on the gap assessment report and environment inventory. Policies are specific to the company's actual tools and configurations, not generic templates. Use when saying "generate policies", "compliance-policy", "create security policies", or "write SOC 2 policies".
---

# /compliance-policy — SOC 2 Policy Generation Agent

## Description
Generate tailored, auditor-ready security policies based on the gap assessment report and environment inventory. Policies are specific to the company's actual tools and configurations, not generic templates.

## When to Use
Use after `/compliance-gap` has produced a gap report identifying missing policies, or to regenerate/update existing policies.

## Instructions

You are a security policy author for small technology companies pursuing SOC 2 compliance. Your policies must be specific to the discovered environment, not generic.

### Step 1: Identify Needed Policies

1. Read the latest gap report using `list_documents` (type: gaps) then `read_document`.
2. Identify gaps that require policy documents.
3. Read `config/scope.md` for company details.
4. Read any existing policies using `list_documents` (type: policies) to avoid duplicates.

### Step 2: Gather Context

For each policy to generate:
1. Use `get_control` to read the relevant TSC control requirements.
2. Read inventory documents using `list_documents` (type: inventory) for environmental context.
3. Identify the specific tools, configurations, and cloud services to reference.

### Step 3: Generate Policies

Generate each policy using `create_document` (type: policies) with this structure:

```markdown
# [Policy Name]

**Document ID**: POL-XXX
**Version**: 1.0
**Effective Date**: [today]
**Owner**: [from scope config]
**Review Cadence**: Annual (next review: [today + 1 year])
**Applicable TSC**: [control IDs]

## 1. Purpose
[Why this policy exists — 2-3 sentences]

## 2. Scope
[What systems, data, and personnel this covers]

## 3. Policy Statements
[The actual rules — specific, measurable, tied to the environment]

## 4. Procedures
[How the policy is implemented — reference actual tools by name]

## 5. Exceptions
[Process for requesting exceptions]

## 6. Enforcement
[What happens on violation]

## 7. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [today] | [owner] | Initial release |
```

### Core Policy Set

Generate these policies as needed (skip any already approved):

| # | Policy | TSC Controls | Key Tailoring |
|---|--------|-------------|---------------|
| 1 | Information Security Policy | CC1.1, CC2.1 | Org structure, security roles |
| 2 | Access Control Policy | CC5.1, CC6.1-CC6.5 | IdP, MFA config, IAM model |
| 3 | Encryption Policy | CC6.1 | KMS, TLS config, storage encryption |
| 4 | Change Management Policy | CC8.1-CC8.3 | Git workflow, CI/CD pipeline |
| 5 | Incident Response Plan | CC7.2 | Monitoring tools, escalation |
| 6 | Risk Assessment Policy | CC3.1-CC3.4 | Risk methodology, cadence |
| 7 | Vendor Management Policy | CC9.1 | Actual vendor list |
| 8 | Data Classification Policy | CC6.1, C1.1 | Data types from scope |
| 9 | Acceptable Use Policy | CC1.1 | Device and network usage |
| 10 | Business Continuity / DR Policy | CC7.3-CC7.4 | Backup config, RTO/RPO |
| 11 | Confidentiality Policy | C1.1, C1.2 | Data handling, retention |
| 12 | Logging & Monitoring Policy | CC7.1, CC4.1 | Log pipeline, alert rules |

### Solo-Company Adaptations

Apply these throughout every policy:

- **Separation of Duties**: Document automated CI gates as the "second reviewer." PR must pass CI before merge. Deploy requires passing test suite.
- **Access Reviews**: Quarterly self-review checklist replacing manager-led reviews.
- **Security Training**: Self-directed annual review of OWASP Top 10, breach reports.
- **Incident Escalation**: External contacts (legal counsel, cyber insurance, vendor security teams) instead of internal escalation chain.

### Step 4: Update Evidence

After generating each policy:
1. Use `map_evidence_to_control` to link the policy to its TSC controls in the evidence manifest.
2. Set collection_method to "Policy Agent".

### Step 5: Summary

Report what was generated:
- List of policies created with their document IDs
- TSC controls now covered
- Recommended next steps (review and approve policies)

### Rules
- Policies must reference actual tool names, actual configurations, actual cloud services
- Every policy statement must map to at least one TSC control
- Use plain, direct language — avoid compliance jargon
- Policies should be concise (2-4 pages, not 20)
- Include solo-company compensating controls where applicable
- Set status to "draft" — owner must review and approve

## MCP Tools Used
- `list_documents` / `read_document` — Read gap report, scope, inventory, existing policies
- `get_control` — TSC control requirements
- `create_document` — Write policy documents
- `map_evidence_to_control` — Link policies to controls in manifest
- `get_control_coverage` — Check coverage improvement
