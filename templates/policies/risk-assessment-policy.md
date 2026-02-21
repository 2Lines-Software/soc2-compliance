---
id: POL-006
title: Risk Assessment Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC3.1, CC3.2, CC3.3, CC3.4]
last_reviewed: null
next_review: null
---

# Risk Assessment Policy

**Document ID**: POL-006
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC3.1, CC3.2, CC3.3, CC3.4

## 1. Purpose

This policy defines how {{company_name}} identifies, evaluates, and manages risks to its information assets, systems, and operations.

## 2. Scope

All information assets, systems, and business processes, including cloud infrastructure, applications, data stores, and third-party integrations.

## 3. Policy Statements

### 3.1 Risk Assessment Cadence
- A formal risk assessment is conducted annually.
- Ad-hoc risk assessments are conducted when significant changes occur (new services, new integrations, architectural changes).

### 3.2 Risk Identification
Risks are identified from:
- External threats (supply chain attacks, credential theft, API abuse, DDoS)
- Internal risks (single point of failure, key person dependency, configuration errors)
- Technology changes (new services, dependency updates, infrastructure changes)
- Vendor/third-party risks (service outages, security incidents)

### 3.3 Risk Evaluation
Risks are scored using a likelihood x impact matrix:

| | Low Impact | Medium Impact | High Impact |
|---|-----------|---------------|-------------|
| **Likely** | Medium | High | Critical |
| **Possible** | Low | Medium | High |
| **Unlikely** | Low | Low | Medium |

### 3.4 Risk Treatment
Each identified risk receives a treatment decision:
- **Mitigate**: Implement controls to reduce risk
- **Accept**: Document acceptance with justification (for low/medium risks)
- **Transfer**: Use insurance or contractual terms (e.g., cyber insurance)
- **Avoid**: Eliminate the activity causing the risk

### 3.5 Risk Register
A risk register is maintained documenting:
- Risk description and category
- Likelihood and impact scores
- Current controls in place
- Treatment decision
- Residual risk level
- Owner and review date

## 4. Procedures

### 4.1 Annual Risk Assessment Process
1. Review previous risk assessment and register
2. Identify new risks from the past year
3. Re-evaluate existing risks for changes in likelihood or impact
4. Score all risks using the evaluation matrix
5. Determine treatment plans for new/changed risks
6. Update the risk register
7. Document the assessment in `evidence/manual/risk-assessment-YYYY.md`

## 5. Exceptions

Risk acceptance decisions for High or Critical risks require enhanced documentation including compensating controls and review timeline.

## 6. Enforcement

Failure to conduct the annual risk assessment is a compliance deficiency that must be remediated immediately.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
