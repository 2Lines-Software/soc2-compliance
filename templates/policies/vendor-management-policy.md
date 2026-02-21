---
id: POL-007
title: Vendor Management Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC9.1, CC9.2]
last_reviewed: null
next_review: null
---

# Vendor Management Policy

**Document ID**: POL-007
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC9.1, CC9.2

## 1. Purpose

This policy defines how {{company_name}} assesses, manages, and monitors third-party vendors that have access to company data or systems.

## 2. Scope

All third-party vendors, service providers, and SaaS tools that process, store, or have access to company or client data.

## 3. Policy Statements

### 3.1 Vendor Inventory
- A vendor inventory is maintained listing all third-party services.
- Each vendor is classified by data sensitivity and business criticality.

### 3.2 Vendor Risk Assessment
- New vendors handling Critical or Sensitive data undergo security assessment before engagement.
- Assessment includes: SOC 2 report review, security questionnaire, or equivalent evidence of security controls.
- Vendor risk is re-assessed annually.

### 3.3 Contractual Requirements
- Data processing agreements (DPAs) in place for vendors handling personal or confidential data.
- Business associate agreements (BAAs) where HIPAA applies.
- Contracts include data return/destruction obligations on termination.

### 3.4 Ongoing Monitoring
- Critical vendor SOC 2 reports are reviewed annually.
- Vendor security incidents are tracked and assessed for impact.
- Vendor access is reviewed as part of quarterly access reviews.

### 3.5 Current Vendor Inventory

| Vendor | Purpose | Data Sensitivity | SOC 2 | DPA |
|--------|---------|-----------------|-------|-----|
| {{cloud_provider}} | Cloud infrastructure | Critical | {{soc2_status}} | {{dpa_status}} |
| {{identity_provider}} | Identity management | Sensitive | {{soc2_status}} | {{dpa_status}} |
| {{source_control_platform}} | Source control & CI/CD | Sensitive | {{soc2_status}} | {{dpa_status}} |
| {{additional_vendors}} | | | | |

## 4. Procedures

### 4.1 Quarterly Vendor Review
1. Review vendor inventory for accuracy
2. Check for any vendor security incidents or advisories
3. Verify critical vendor SOC 2 reports are current
4. Review vendor access and permissions
5. Document review in `evidence/reviews/vendor-review-YYYY-QN.md`

## 5. Exceptions

Vendors without SOC 2 reports may be used if compensating controls are documented (e.g., security questionnaire, penetration test results, ISO 27001 certification).

## 6. Enforcement

Vendors that fail to meet security requirements or provide requested documentation may be subject to engagement termination.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
