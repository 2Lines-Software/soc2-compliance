---
id: POL-005
title: Incident Response Plan
status: draft
version: "1.0"
owner: "{{owner_name}}"
tsc_criteria: [CC7.2]
last_reviewed: null
next_review: null
---

# Incident Response Plan

**Document ID**: POL-005
**Version**: 1.0
**Effective Date**: {{effective_date}}
**Owner**: {{owner_name}}, {{owner_role}} — {{company_name}}
**Review Cadence**: Annual (next review: {{next_review_date}})
**Applicable TSC**: CC7.2

## 1. Purpose

This plan defines how {{company_name}} detects, responds to, and recovers from security incidents to minimize impact and meet regulatory and contractual obligations.

## 2. Scope

All security events affecting company systems, data, or operations, including data breaches, unauthorized access, malware, service outages, and third-party security incidents affecting our data.

## 3. Policy Statements

### 3.1 Incident Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| Critical | Active data breach, production compromise | Immediate (< 1 hr) | Unauthorized data access, credential theft, ransomware |
| High | Potential breach, significant vulnerability | < 4 hours | Suspicious login activity, unpatched critical CVE |
| Medium | Security concern, no active threat | < 24 hours | Failed access attempts, policy violations |
| Low | Informational, minor issue | < 72 hours | Phishing attempt blocked, minor config drift |

### 3.2 Incident Response Phases

**Detection**: Security events are detected through:
- {{cloud_provider}} monitoring and alerting
- {{log_provider}} log aggregation
- Vulnerability scanning and Dependabot alerts
- Manual observation

**Containment**: Immediate actions to limit impact:
- Revoke compromised credentials
- Isolate affected systems
- Block malicious IPs/endpoints
- Preserve evidence (logs, snapshots)

**Eradication**: Remove the threat:
- Patch vulnerabilities
- Remove malware/unauthorized access
- Rotate all potentially compromised credentials

**Recovery**: Restore normal operations:
- Restore from known-good backups if needed
- Verify system integrity
- Resume normal monitoring

**Post-Incident Review**: Within 72 hours:
- Document timeline and root cause
- Identify improvements to prevent recurrence
- Update controls and procedures as needed
- Store review in `evidence/reviews/`

### 3.3 Escalation Contacts (Solo-Company Adaptation)

| Contact | Role | When to Engage |
|---------|------|---------------|
| {{owner_name}} | Security Owner / Incident Commander | All incidents |
| {{legal_counsel}} | Legal Counsel | Potential data breaches, regulatory implications |
| {{cyber_insurance}} | Cyber Insurance Provider | Claims, breach response services |
| {{cloud_provider}} Support | Cloud Provider | Infrastructure compromises |
| Affected clients | Client contacts | When client data is impacted (per contractual obligations) |

### 3.4 Notification Requirements
- Affected clients: Within 72 hours of confirmed breach (or per contract terms)
- Regulatory authorities: Per applicable privacy regulations
- Cloud provider: Per shared responsibility model

## 4. Procedures

### 4.1 Incident Response Workflow
1. **Detect**: Receive alert or observation
2. **Triage**: Classify severity per table above
3. **Contain**: Take immediate containment actions
4. **Investigate**: Determine scope, root cause, and impact
5. **Eradicate**: Remove the threat
6. **Recover**: Restore normal operations
7. **Review**: Conduct post-incident review
8. **Document**: Store incident record and review

### 4.2 Annual Tabletop Exercise
1. Select a realistic incident scenario
2. Walk through the response plan step by step
3. Document decisions, gaps, and timing
4. Update the IR plan based on findings
5. Store exercise record as evidence

## 5. Exceptions

No exceptions to incident response requirements. All security events must be triaged.

## 6. Enforcement

Failure to report known security events is a policy violation subject to access revocation.

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {{effective_date}} | {{owner_name}} | Initial release |
