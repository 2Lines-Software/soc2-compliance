---
id: POL-003
title: Encryption Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC6.1]
last_reviewed: null
next_review: null
---

# Encryption Policy

**Document ID**: POL-003
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC6.1

## 1. Purpose

This policy defines encryption requirements for data at rest and in transit to protect company and client information from unauthorized access.

## 2. Scope

All systems storing or transmitting data classified as Critical, Sensitive, or Internal, including cloud storage, databases, APIs, and endpoint devices.

## 3. Policy Statements

### 3.1 Encryption at Rest
- All cloud storage uses server-side encryption (AES-256 or equivalent).
- Database encryption is enabled on all {{cloud_provider}} database services.
- Endpoint devices use full-disk encryption (FileVault on macOS, BitLocker on Windows).
- Encryption keys are managed through {{cloud_provider}} KMS.

### 3.2 Encryption in Transit
- All external communications use TLS 1.2 or higher.
- TLS 1.0 and 1.1 are explicitly disabled.
- Internal service-to-service communication uses TLS.
- API endpoints enforce HTTPS-only connections.

### 3.3 Key Management
- Encryption keys are managed through {{cloud_provider}} KMS (cloud-managed keys).
- Customer-managed keys (CMEK) are used for Critical data stores where supported.
- Key rotation follows {{cloud_provider}} managed rotation schedules.
- Key access is restricted to minimum necessary IAM roles.

### 3.4 Certificate Management
- TLS certificates are managed through {{certificate_provider}}.
- Certificate expiration is monitored with alerts set for 30 days before expiry.
- Self-signed certificates are not used in production.

## 4. Procedures

### 4.1 Verifying Encryption Configuration
1. Check {{cloud_provider}} storage encryption settings quarterly
2. Verify TLS configuration on all public endpoints
3. Confirm endpoint device encryption status
4. Review KMS key access policies
5. Document findings in evidence

## 5. Exceptions

Exceptions for non-encrypted data transfer (e.g., legacy integrations) require documented risk acceptance and compensating controls.

## 6. Enforcement

Systems found without required encryption are flagged for immediate remediation. Non-compliance is tracked as a control deficiency.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
