---
id: POL-002
title: Access Control Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC5.1, CC6.1, CC6.2, CC6.3, CC6.4, CC6.5]
last_reviewed: null
next_review: null
---

# Access Control Policy

**Document ID**: POL-002
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC5.1, CC6.1, CC6.2, CC6.3, CC6.4, CC6.5

## 1. Purpose

This policy defines how access to systems, data, and resources is granted, managed, reviewed, and revoked at {{company_name}}.

## 2. Scope

All systems and accounts including:
- {{cloud_provider}} IAM (accounts, roles, service accounts)
- {{identity_provider}} (user directory, SSO, MFA)
- {{source_control_platform}} (repositories, organization access)
- CI/CD systems ({{cicd_platform}})
- SaaS tools and third-party services
- Endpoint devices

## 3. Policy Statements

### 3.1 Authentication
- Multi-factor authentication (MFA) is required on all accounts without exception.
- SSO via {{identity_provider}} is used where supported.
- Service accounts use API keys or OAuth tokens with minimum necessary scopes.
- Passwords meet minimum complexity: 12+ characters, unique per service.

### 3.2 Authorization
- Access follows the principle of least privilege.
- Role-based access control (RBAC) is used for {{cloud_provider}} IAM.
- No wildcard IAM policies are permitted.
- Service account permissions are scoped to specific resources.

### 3.3 Access Provisioning
- New access requests are documented before being granted.
- Contractor access includes expiration dates and is scoped to project needs.
- Default-deny: access is not granted unless explicitly required.

### 3.4 Access Removal
- Access is revoked within 24 hours when no longer needed.
- Contractor access is revoked on engagement completion.
- API keys and tokens are rotated or revoked when personnel depart.

### 3.5 Access Reviews (Solo-Company Adaptation)
- Quarterly self-review of all access grants:
  - {{cloud_provider}} IAM users, roles, and policies
  - {{identity_provider}} OAuth app authorizations
  - API keys and service account credentials (check rotation dates)
  - {{source_control_platform}} collaborators and deploy keys
- Review documented in `evidence/reviews/access-review-YYYY-QN.md`

## 4. Procedures

### 4.1 Quarterly Access Review Checklist
1. Export current IAM user/role list from {{cloud_provider}}
2. Review each access grant for continued business need
3. Verify MFA is enabled on all accounts
4. Check API key and service account key ages (rotate if > 90 days)
5. Review OAuth app authorizations in {{identity_provider}}
6. Review {{source_control_platform}} collaborators and access
7. Document findings and remediation actions

### 4.2 Service Account Key Rotation
1. Generate new key via {{cloud_provider}} console/CLI
2. Update consuming service with new key
3. Verify service operates correctly with new key
4. Delete old key
5. Record rotation date

## 5. Exceptions

Exceptions require documented justification and compensating controls. Exception duration must not exceed 90 days without re-evaluation.

## 6. Enforcement

Unauthorized access attempts are logged and investigated. Policy violations result in immediate access review and potential revocation.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
