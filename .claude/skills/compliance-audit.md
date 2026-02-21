# /compliance-audit — Audit Readiness Checker

## Description
Validate that all required documentation, evidence, and controls are in place before a SOC 2 Type I audit. Produces a readiness assessment with a clear pass/fail verdict and actionable items for any gaps.

## When to Use
Use before scheduling an audit engagement to verify readiness, or periodically to track progress toward audit readiness.

## Instructions

You are a SOC 2 audit readiness assessor. Your job is to verify that everything an auditor needs is in place, complete, and current. Be thorough and specific.

### Step 1: Gather Current State

Collect data from all compliance areas:

1. **Dashboard**: Use `get_compliance_dashboard` for overall metrics.
2. **Policies**: Use `list_documents` (type: policies) to list all policies and their statuses.
3. **Evidence**: Use `get_evidence_manifest` to check evidence coverage.
4. **Controls**: Use `get_control_coverage` to check control coverage.
5. **Gap Reports**: Use `list_documents` (type: gaps) to find the latest gap report.
6. **Scope**: Use `read_document` on `config/scope.md` to verify scope is complete.

### Step 2: Run Readiness Checklist

Evaluate each requirement and mark pass/fail:

#### A. Governance & Scope
- [ ] Company profile / scope document is complete (no `{{placeholder}}` values)
- [ ] TSC scope is defined (Security + Confidentiality)
- [ ] Security owner is documented
- [ ] Assessment date is current

#### B. Policies (all must be "approved" status)
Required policies for Security + Confidentiality:
- [ ] Information Security Policy
- [ ] Access Control Policy
- [ ] Encryption Policy
- [ ] Change Management Policy
- [ ] Incident Response Plan
- [ ] Risk Assessment Policy
- [ ] Vendor Management Policy
- [ ] Data Classification Policy
- [ ] Acceptable Use Policy
- [ ] Business Continuity / DR Policy
- [ ] Confidentiality Policy
- [ ] Logging & Monitoring Policy

For each policy, verify:
- Status is "approved" (not draft or review)
- Has been reviewed within the past 12 months
- References actual tools and configurations (not generic)
- Includes solo-company compensating controls where applicable

#### C. Evidence Coverage
For each control in the TSC scope, verify evidence exists:
- [ ] CC1: Control environment documentation
- [ ] CC2: Policy acknowledgment / training records
- [ ] CC3: Risk assessment document
- [ ] CC4: Monitoring configuration evidence
- [ ] CC5: Access control evidence (MFA, RBAC, access reviews)
- [ ] CC6: Encryption and network security evidence
- [ ] CC7: Monitoring, IR plan, BCP/DR evidence
- [ ] CC8: Change management evidence (branch protection, CI/CD)
- [ ] CC9: Vendor inventory and risk assessments
- [ ] C1: Data classification, protection, retention, disposal evidence

#### D. Gap Resolution
- [ ] No critical gaps (score 1) remain unresolved
- [ ] All medium gaps have documented remediation plans
- [ ] Compensating controls are documented for solo-company adaptations

#### E. Document Currency
- [ ] No expired policies
- [ ] No evidence older than 12 months (for Type I)
- [ ] Scope config reflects current environment

### Step 3: Produce Assessment

Use `run_readiness_check` to write the assessment with this structure:

```markdown
# Audit Readiness Assessment

**Company**: [from scope]
**Date**: [today]
**Scope**: SOC 2 Type I — Security, Confidentiality
**Assessed by**: Audit Readiness Agent

## Verdict: [READY / NOT READY / READY WITH CAVEATS]

## Summary
- Policies: [X/12] approved
- Evidence coverage: [X]%
- Critical gaps remaining: [count]
- Medium gaps remaining: [count]

## Checklist Results

### A. Governance & Scope
[pass/fail for each item]

### B. Policy Status
| Policy | Status | Last Reviewed | Verdict |
|--------|--------|--------------|---------|
[one row per policy]

### C. Evidence Coverage
| Control Area | Controls | Evidence | Coverage |
|-------------|----------|----------|----------|
[one row per CC/C criteria group]

### D. Gap Status
| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
[list of open gaps]

### E. Document Currency
[list of any expired or outdated documents]

## Action Items
[Numbered list of specific things to fix before engaging an auditor]

## Recommendations
- [Auditor selection tips for small companies]
- [What to expect in a Type I audit]
- [Timeline estimate to address remaining items]
```

### Step 4: Summary

Report the verdict clearly:
- **READY**: All checklist items pass. Recommend scheduling audit.
- **READY WITH CAVEATS**: Minor items remain but can be resolved during audit prep.
- **NOT READY**: Critical items missing. List specific actions needed.

## MCP Tools Used
- `get_compliance_dashboard` — Overall metrics
- `list_documents` — Policies, gaps, evidence inventory
- `read_document` — Read specific documents for detail
- `get_evidence_manifest` — Evidence coverage
- `get_control_coverage` — Control coverage
- `run_readiness_check` — Write the assessment report
