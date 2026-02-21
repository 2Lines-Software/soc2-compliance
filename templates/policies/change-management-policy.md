---
id: POL-004
title: Change Management Policy
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC8.1, CC8.2, CC8.3]
last_reviewed: null
next_review: null
---

# Change Management Policy

**Document ID**: POL-004
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC8.1, CC8.2, CC8.3

## 1. Purpose

This policy defines the process for managing changes to code, infrastructure, and configurations to ensure stability, security, and traceability.

## 2. Scope

All changes to production systems, including application code, infrastructure configuration, database schemas, and third-party integrations.

## 3. Policy Statements

### 3.1 Standard Change Process
- All code changes go through pull requests on {{source_control_platform}}.
- Branch protection is enabled on main/production branches: direct commits are blocked.
- CI pipeline ({{cicd_platform}}) must pass before merge: automated tests, linting, security scanning.
- All changes are linked to a description of the change purpose.

### 3.2 Separation of Duties (Solo-Company Adaptation)
- Automated CI/CD gates serve as the independent verification layer, compensating for single-person review.
- Required CI checks: unit tests, linting, and security scanning.
- Deployments are automated through the CI/CD pipeline — no manual production access for deployments.
- This compensating control is documented and acknowledged.

### 3.3 Infrastructure Changes
- Infrastructure changes use infrastructure-as-code (IaC) where possible.
- IaC changes follow the same PR-based workflow as application code.
- Manual infrastructure changes are documented with before/after configuration.

### 3.4 Emergency Changes
- Emergency changes may bypass normal CI gates when:
  - Production is down or data is at risk
  - The change is a targeted fix for a specific issue
- Emergency changes require:
  - Post-hoc documentation within 24 hours
  - Follow-up PR with proper review
  - Incident record linking the emergency change

### 3.5 Configuration Management
- Production configurations are version-controlled.
- Configuration changes follow the same approval process as code changes.
- Drift detection is used where supported by {{cloud_provider}}.

## 4. Procedures

### 4.1 Standard Change Workflow
1. Create feature branch from main
2. Implement change with tests
3. Open pull request with description
4. CI pipeline runs: tests, lint, security scan
5. All CI checks pass → merge to main
6. Automated deployment to production
7. Verify deployment success via monitoring

### 4.2 Emergency Change Workflow
1. Identify the emergency and assess impact
2. Implement minimal targeted fix
3. Deploy directly if CI pipeline is too slow for the emergency
4. Create post-hoc pull request within 24 hours
5. Document the emergency change in an incident record
6. Review in next quarterly security review

## 5. Exceptions

Bypassing CI checks for non-emergency changes requires documented justification and is tracked as a control exception.

## 6. Enforcement

Changes that bypass the standard process without emergency justification are flagged for review. Repeated bypasses trigger a process improvement review.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
