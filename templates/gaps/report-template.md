---
id: "GAP-{{date}}"
title: "SOC 2 Gap Assessment Report"
status: draft
version: "1.0"
assessment_date: "{{date}}"
---

# SOC 2 Gap Assessment Report

**Company**: {{company_name}}
**Date**: {{date}}
**Scope**: SOC 2 Type I — Security, Confidentiality
**Assessed by**: Compliance Gap Agent

## Executive Summary

- **Controls assessed**: {{total_controls}}
- **Fully met**: {{fully_met}} ({{fully_met_pct}}%)
- **Partially met**: {{partially_met}} ({{partially_met_pct}}%)
- **Not met**: {{not_met}} ({{not_met_pct}}%)
- **Not assessed**: {{not_assessed}}
- **Estimated remediation effort**: {{effort_estimate}}
- **Audit readiness**: {{readiness_level}}

## Critical Gaps (Must Fix)

### GAP-001: {{gap_title}}
- **Control**: {{control_id}}
- **Current state**: {{current_state}}
- **Risk**: {{risk_description}}
- **Remediation**: {{remediation_steps}}
- **Effort**: {{effort}}
- **Priority**: Critical

## Medium Gaps (Should Fix)

### GAP-XXX: {{gap_title}}
- **Control**: {{control_id}}
- **Current state**: {{current_state}}
- **Risk**: {{risk_description}}
- **Remediation**: {{remediation_steps}}
- **Effort**: {{effort}}
- **Priority**: Medium

## Controls Fully Met (Evidence Collected)

| Control | Description | Evidence Location |
|---------|-------------|-------------------|
| {{control_id}} | {{description}} | {{evidence_path}} |

## Compensating Controls (Solo-Company)

| Standard Control | Compensating Control | Justification |
|-----------------|---------------------|---------------|
| Separation of duties in change management | Automated CI/CD gates (tests, lint, security scan) | Independent automated verification substitutes for human reviewer |
| Manager-led access reviews | Quarterly self-review with documented checklist | Single-person org; automated IAM enforcement supplements review |
| Formal training program | Self-directed annual security training | Documented completion with topics and takeaways |

## Remediation Roadmap

| Week | Action | Gaps Addressed | Effort |
|------|--------|---------------|--------|
| 1 | {{action}} | {{gaps}} | {{effort}} |

## Next Steps

1. Address Critical gaps first (estimated {{critical_effort}})
2. Generate missing policies using `/compliance-policy`
3. Collect evidence using `/compliance-evidence`
4. Re-run gap analysis to verify progress
5. Run `/compliance-audit` when ready for audit readiness check
