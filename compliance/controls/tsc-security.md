---
id: TSC-SEC
title: "TSC: Security (Common Criteria)"
status: approved
version: "1.0"
tsc_criteria: [CC1, CC2, CC3, CC4, CC5, CC6, CC7, CC8, CC9]
---

# TSC: Security (Common Criteria — CC)

## CC1 — Control Environment

### CC1.1 — Organization and Management
- **What the auditor looks for**: Defined organizational structure, roles, responsibilities for security. Board/management oversight of security program.
- **Evidence types**: Org chart, role descriptions, security committee minutes, information security policy
- **Typical controls**:
  - Documented security roles and responsibilities
  - Regular security program reviews by management
  - Security awareness program
  - Code of conduct / acceptable use policy
- **Solo-company note**: For a 1-5 person org, this simplifies to: the principal is the security owner. Document that fact and maintain a cadence of self-review (quarterly recommended).
- **Compensating control**: Automated compliance monitoring and quarterly self-assessment replace formal committee oversight.

### CC1.2 — Board of Directors / Governance
- **What the auditor looks for**: Oversight body that is independent of management, or documented governance structure.
- **Evidence types**: Governance documentation, meeting minutes
- **Typical controls**:
  - Board or advisory oversight of security
  - Independence from day-to-day operations
- **Solo-company note**: Satisfied by documenting that the principal serves as both management and governance. Reference external advisors (legal counsel, accountant) as additional oversight where applicable.
- **Compensating control**: Documented governance structure with external advisory relationships.

### CC1.3 — Management Philosophy and Operating Style
- **What the auditor looks for**: Tone at the top — management's commitment to integrity and security.
- **Evidence types**: Security policy endorsement, communication records
- **Typical controls**:
  - Signed security policy by leadership
  - Regular security communications
- **Solo-company note**: The principal's direct authorship and enforcement of policies demonstrates commitment. Document this in the information security policy.

### CC1.4 — Organizational Structure
- **What the auditor looks for**: Clear reporting lines and accountability for security.
- **Evidence types**: Org chart, RACI matrix
- **Typical controls**:
  - Documented organizational structure
  - Clear security accountability
- **Solo-company note**: Single-person org chart with all security responsibilities assigned to the principal. Simple but must be documented.

### CC1.5 — Commitment to Competence
- **What the auditor looks for**: Personnel have required skills and training for their security responsibilities.
- **Evidence types**: Training records, certifications, professional development
- **Typical controls**:
  - Security awareness training (annual minimum)
  - Role-specific technical training
  - Professional development tracking
- **Solo-company note**: Self-directed annual security training. Document completion of OWASP reviews, security conference attendance, or relevant coursework.

---

## CC2 — Communication and Information

### CC2.1 — Internal Communication
- **What the auditor looks for**: Security policies and procedures communicated to all personnel.
- **Evidence types**: Policy acknowledgment records, training completion logs, onboarding documentation
- **Typical controls**:
  - Security policy distribution and acknowledgment
  - Security awareness training (annual minimum)
  - New hire security onboarding
- **Solo-company note**: Self-acknowledgment of policies is acceptable. Document the date you reviewed and accepted each policy. For contractors, include policy acknowledgment in engagement agreements.

### CC2.2 — External Communication
- **What the auditor looks for**: Process for communicating security commitments to external parties.
- **Evidence types**: Client contracts with security terms, privacy policy, terms of service
- **Typical controls**:
  - Security commitments in contracts/SLAs
  - Public-facing security documentation
  - Incident notification procedures
- **Solo-company note**: Include security and data handling terms in client contracts. Maintain a public security page or privacy policy.

### CC2.3 — Communication of Objectives
- **What the auditor looks for**: Security objectives are clearly defined and communicated.
- **Evidence types**: Security program documentation, risk appetite statement
- **Typical controls**:
  - Documented security objectives
  - Regular communication of security priorities

---

## CC3 — Risk Assessment

### CC3.1 — Risk Identification
- **What the auditor looks for**: Formal risk assessment process with documented methodology.
- **Evidence types**: Risk register, risk assessment methodology document, risk appetite statement
- **Typical controls**:
  - Annual risk assessment
  - Documented risk appetite/tolerance
  - Risk treatment plans
- **MCP discovery targets**: Cloud security posture, known vulnerabilities, access patterns
- **Solo-company note**: A lightweight annual risk assessment is sufficient. Use a simple risk register (likelihood x impact matrix). Focus on risks specific to your environment and data handling.

### CC3.2 — Risk Factors
- **What the auditor looks for**: Consideration of internal and external risk factors including fraud risk.
- **Evidence types**: Risk assessment documentation covering threat landscape
- **Typical controls**:
  - External threat monitoring
  - Internal risk factor analysis
  - Technology change risk assessment
- **Solo-company note**: Document key external threats (supply chain attacks, credential theft, API abuse) and internal risks (single point of failure, key person dependency).

### CC3.3 — Risk Evaluation
- **What the auditor looks for**: Process for evaluating identified risks and determining response.
- **Evidence types**: Risk scoring methodology, risk treatment decisions
- **Typical controls**:
  - Risk scoring/ranking methodology
  - Risk acceptance criteria
  - Risk treatment plans (accept, mitigate, transfer, avoid)

### CC3.4 — Change-Related Risks
- **What the auditor looks for**: Assessment of risks when significant changes occur.
- **Evidence types**: Change risk assessments, architecture review records
- **Typical controls**:
  - Risk assessment for significant changes
  - Architecture review process

---

## CC4 — Monitoring Activities

### CC4.1 — Ongoing Monitoring
- **What the auditor looks for**: Continuous monitoring of controls to ensure they operate effectively.
- **Evidence types**: Monitoring dashboards, alert configurations, review records
- **Typical controls**:
  - Automated security monitoring
  - Regular control effectiveness reviews
  - Exception tracking
- **MCP discovery targets**: Cloud monitoring config, alert rules, SIEM setup
- **Solo-company note**: Automated monitoring tools are essential as a compensating control for limited personnel. Cloud-native monitoring (CloudWatch, Cloud Monitoring, etc.) plus alerting to email/Slack.

### CC4.2 — Deficiency Evaluation
- **What the auditor looks for**: Process for evaluating and remediating identified control deficiencies.
- **Evidence types**: Remediation tracking, gap analysis records
- **Typical controls**:
  - Control deficiency tracking
  - Remediation timelines and accountability
  - Root cause analysis for failures

---

## CC5 — Control Activities

### CC5.1 — Logical Access Controls
- **What the auditor looks for**: Access restricted to authorized users based on business need.
- **Evidence types**: User access lists, MFA configuration, RBAC policies, access review records
- **Typical controls**:
  - Multi-factor authentication (MFA) on all accounts
  - Role-based access control (RBAC)
  - Principle of least privilege
  - Quarterly access reviews
  - Unique user identification
- **MCP discovery targets**: Identity provider config, cloud IAM policies, MFA status
- **Solo-company note**: MFA on everything. Quarterly self-review of all cloud IAM grants, OAuth app authorizations, and API keys. Document the review.
- **Compensating control**: Automated IAM policy enforcement and quarterly self-review replace manager-led access reviews.

### CC5.2 — System Operations Controls
- **What the auditor looks for**: Controls over system operations including change management, incident response.
- **Evidence types**: CI/CD pipeline config, PR review requirements, incident response plan, deployment logs
- **Typical controls**:
  - Formal change management process
  - Code review requirements
  - Automated testing before deployment
  - Incident detection and response
- **MCP discovery targets**: GitHub/GitLab branch protection rules, CI/CD pipeline config, deployment automation
- **Solo-company note**: PR-based workflow with CI gates serves as the change control process. Automated tests are the "second reviewer."
- **Compensating control**: CI/CD gates (test suite, linting, security scanning) substitute for human separation of duties in change management.

### CC5.3 — Technology Infrastructure Controls
- **What the auditor looks for**: Controls over the technology infrastructure supporting the system.
- **Evidence types**: Infrastructure configuration, patching records, capacity monitoring
- **Typical controls**:
  - Automated patching/updates
  - Capacity monitoring
  - Infrastructure-as-code

---

## CC6 — Logical and Physical Access Controls

### CC6.1 — Encryption and Data Protection
- **What the auditor looks for**: Data encrypted at rest and in transit. Key management controls.
- **Evidence types**: TLS config, disk encryption settings, KMS configuration, certificate inventory
- **Typical controls**:
  - Encryption at rest (AES-256 or equivalent)
  - Encryption in transit (TLS 1.2+)
  - Key management (KMS, rotation policies)
  - Certificate management
- **MCP discovery targets**: Cloud storage encryption settings, load balancer TLS config, database encryption, KMS key inventory
- **Solo-company note**: Use cloud-managed encryption services (AWS KMS, GCP CMEK, etc.) to reduce key management burden. Document encryption configuration per service.

### CC6.2 — User Authentication
- **What the auditor looks for**: Authentication mechanisms are appropriate for the risk level.
- **Evidence types**: MFA configuration, password policy, SSO configuration
- **Typical controls**:
  - MFA enforced for all access
  - Strong password policies (or passwordless)
  - SSO where available
  - Session management (timeouts, invalidation)
- **MCP discovery targets**: IdP MFA policies, password policy configuration

### CC6.3 — Access Provisioning
- **What the auditor looks for**: Formal process for granting, modifying, and revoking access.
- **Evidence types**: Access provisioning procedures, access request records, offboarding checklists
- **Typical controls**:
  - Documented access provisioning process
  - Access request and approval workflow
  - Timely access revocation on termination
- **Solo-company note**: For contractors, document onboarding/offboarding checklists. For the principal, access is inherent but should be documented.

### CC6.4 — Access Removal
- **What the auditor looks for**: Timely removal of access when no longer needed.
- **Evidence types**: Offboarding records, access revocation evidence
- **Typical controls**:
  - Offboarding checklist with access revocation
  - Automated access expiration where possible

### CC6.5 — Access Review
- **What the auditor looks for**: Periodic review of access rights.
- **Evidence types**: Access review records, remediation actions taken
- **Typical controls**:
  - Quarterly access reviews
  - Remediation of inappropriate access
- **Solo-company note**: Quarterly self-review checklist: review all cloud IAM grants, OAuth app authorizations, API keys, and service account permissions.

### CC6.6 — System Boundaries and Network Security
- **What the auditor looks for**: Network segmentation, firewalls, boundary protection.
- **Evidence types**: Security group rules, network ACLs, VPC config, firewall rules
- **Typical controls**:
  - Network segmentation (VPCs, subnets)
  - Firewall rules / security groups
  - Ingress/egress controls
  - DDoS protection
- **MCP discovery targets**: Cloud VPC/security group configs, firewall rules, load balancer config

### CC6.7 — System Component Management
- **What the auditor looks for**: Inventory and management of system components.
- **Evidence types**: Asset inventory, configuration baselines
- **Typical controls**:
  - System component inventory
  - Configuration baselines
  - Unauthorized component detection

### CC6.8 — Physical Access Controls
- **What the auditor looks for**: Physical access to facilities and equipment is restricted.
- **Evidence types**: Physical security documentation
- **Typical controls**:
  - Data center physical controls (delegated to cloud provider)
  - Endpoint device physical security
- **Solo-company note**: Cloud providers handle data center physical security (reference their SOC 2 reports). For endpoint devices, document: disk encryption, screen lock, physical custody controls.

---

## CC7 — System Operations

### CC7.1 — Monitoring and Detection
- **What the auditor looks for**: Detection of anomalies, security events, and operational issues.
- **Evidence types**: Monitoring tool config, alert rules, SIEM dashboards, log retention config
- **Typical controls**:
  - Security event monitoring
  - Log aggregation and retention
  - Alerting on anomalies
  - Intrusion detection
  - Vulnerability scanning
- **MCP discovery targets**: CloudWatch/Stackdriver alerts, log aggregation config, SIEM rules, vulnerability scan results
- **Solo-company note**: Cloud-native monitoring is usually sufficient. Ensure: audit logging enabled, alerts configured for critical events (root login, IAM changes, unusual API activity), logs retained for 12+ months.

### CC7.2 — Incident Response
- **What the auditor looks for**: Documented incident response plan with tested procedures.
- **Evidence types**: IR plan document, post-incident reviews, tabletop exercise records
- **Typical controls**:
  - Documented incident response plan
  - Incident classification and severity levels
  - Escalation procedures
  - Post-incident review process
  - Annual IR plan testing (tabletop exercise)
- **Solo-company note**: IR plan must account for solo operations. Include external escalation contacts (legal counsel, cyber insurance, affected client notification). Annual tabletop exercise can be a documented self-walkthrough of a scenario.

### CC7.3 — Business Continuity
- **What the auditor looks for**: Plans to maintain operations during disruptions.
- **Evidence types**: BCP/DR plan, backup configuration, recovery testing records
- **Typical controls**:
  - Business continuity plan
  - Disaster recovery plan
  - Regular backup verification
  - Recovery time/point objectives (RTO/RPO)
- **MCP discovery targets**: Backup configurations, snapshot schedules, replication settings
- **Solo-company note**: Document backup strategy, recovery procedures, and test recovery annually. Cloud-managed services reduce DR complexity significantly.

### CC7.4 — System Recovery
- **What the auditor looks for**: Ability to recover systems to a known good state.
- **Evidence types**: Recovery procedures, backup restoration test records
- **Typical controls**:
  - Documented recovery procedures
  - Regular recovery testing
  - Backup integrity verification

---

## CC8 — Change Management

### CC8.1 — Change Control Process
- **What the auditor looks for**: Formal change approval, testing before deployment, rollback capability.
- **Evidence types**: PR merge requirements, CI test gates, deploy logs, change records
- **Typical controls**:
  - Formal change request/approval process
  - Code review requirements
  - Pre-deployment testing (automated)
  - Deployment approval gates
  - Rollback procedures
  - Change documentation
- **MCP discovery targets**: GitHub branch protection rules, CI/CD pipeline config, deployment automation
- **Solo-company note**: Git-based workflow with branch protection, CI test gates, and automated deployment is the change control process. Document this as the formal process.
- **Compensating control**: Automated CI/CD pipeline (tests, linting, security scanning) provides independent verification in place of human separation of duties.

### CC8.2 — Configuration Management
- **What the auditor looks for**: Baseline configurations maintained and changes tracked.
- **Evidence types**: Infrastructure-as-code, configuration drift detection
- **Typical controls**:
  - Infrastructure as code (IaC)
  - Configuration baselines
  - Drift detection

### CC8.3 — Emergency Changes
- **What the auditor looks for**: Process for handling urgent changes that bypass normal controls.
- **Evidence types**: Emergency change procedures, emergency change records
- **Typical controls**:
  - Documented emergency change process
  - Post-hoc review of emergency changes
  - Emergency change logging

---

## CC9 — Risk Mitigation

### CC9.1 — Vendor Management
- **What the auditor looks for**: Third-party risk assessment and ongoing management.
- **Evidence types**: Vendor inventory, risk assessments, SOC 2 reports, BAAs/DPAs, contracts
- **Typical controls**:
  - Vendor inventory with risk classification
  - Annual vendor risk assessment
  - Review of vendor SOC 2 / security certifications
  - Data processing agreements in place
  - Vendor access controls
- **Solo-company note**: Maintain a simple vendor inventory. For critical vendors (cloud provider, payment processor, etc.), collect and review their SOC 2 reports annually. Ensure data processing agreements are in place.

### CC9.2 — Risk Mitigation Activities
- **What the auditor looks for**: Specific activities to mitigate identified risks.
- **Evidence types**: Risk treatment plans, mitigation evidence
- **Typical controls**:
  - Risk treatment implementation
  - Residual risk tracking
  - Risk acceptance documentation

---

## Control Summary

| Criteria | Sub-controls | Key Focus |
|----------|-------------|-----------|
| CC1 | CC1.1-CC1.5 | Control environment, governance, competence |
| CC2 | CC2.1-CC2.3 | Communication of policies and objectives |
| CC3 | CC3.1-CC3.4 | Risk assessment and evaluation |
| CC4 | CC4.1-CC4.2 | Monitoring and deficiency management |
| CC5 | CC5.1-CC5.3 | Logical access and system operations |
| CC6 | CC6.1-CC6.8 | Access controls, encryption, boundaries |
| CC7 | CC7.1-CC7.4 | Monitoring, IR, BCP, recovery |
| CC8 | CC8.1-CC8.3 | Change management and configuration |
| CC9 | CC9.1-CC9.2 | Vendor management and risk mitigation |

**Total sub-controls**: 35
