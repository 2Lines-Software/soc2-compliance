---
id: POL-008
title: Data Classification Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC6.1, C1.1.1, C1.1.2, C1.1.3]
last_reviewed: null
next_review: null
---

# Data Classification Policy

**Document ID**: POL-008
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC6.1, C1.1.1, C1.1.2, C1.1.3

## 1. Purpose

This policy defines how {{company_name}} classifies, handles, and protects data based on its sensitivity level.

## 2. Scope

All data created, received, maintained, or transmitted by {{company_name}}, regardless of format or storage location.

## 3. Policy Statements

### 3.1 Classification Levels

| Level | Description | Handling Requirements |
|-------|-------------|----------------------|
| **Critical** | Data whose compromise would cause severe business or legal impact | Encrypted at rest and in transit, access logged, minimum-privilege access, no sharing without authorization |
| **Sensitive** | Data requiring protection but with lower impact if compromised | Encrypted at rest and in transit, access restricted to business need |
| **Internal** | Business data not intended for public release | Stored in authorized systems, not shared publicly |
| **Public** | Data intended for public consumption | No special handling required |

### 3.2 Data Inventory

| Data Type | Classification | Location | Access |
|-----------|---------------|----------|--------|
| {{critical_data}} | Critical | {{location}} | {{access}} |
| {{sensitive_data}} | Sensitive | {{location}} | {{access}} |
| {{internal_data}} | Internal | {{location}} | {{access}} |
| {{public_data}} | Public | {{location}} | {{access}} |

### 3.3 Handling Requirements
- Critical data stores are in private subnets with no public access.
- API endpoints handling Critical data require authentication and rate limiting.
- Confidential data is not stored in logs, error messages, or debug output.
- Data classification is considered when selecting storage services and regions.

### 3.4 Data Flow
- Document where confidential data enters, moves through, and exits your systems.
- Third-party data sharing is governed by the Vendor Management Policy (POL-007).
- Data transmitted to external parties uses encrypted channels only.

## 4. Procedures

### 4.1 Data Classification Review
1. Review data inventory annually
2. Classify new data types as they are introduced
3. Verify handling requirements are enforced per classification
4. Update data flow documentation as architecture changes

## 5. Exceptions

Temporary storage of Critical data in non-standard locations requires documented justification, time limit, and compensating controls.

## 6. Enforcement

Data handling violations are treated as security incidents per the Incident Response Plan (POL-005).

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
