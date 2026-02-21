# Common Security Questionnaire Questions

This reference contains the most frequently asked questions across standard security questionnaires (SIG Lite, CAIQ, VSA, Plaid, and common enterprise vendor assessments). The `/compliance-trust-center` skill uses these to generate a pre-answered questionnaire from the compliance knowledge base.

Questions are grouped by domain. For each question, the **source** column indicates which compliance documents contain the answer.

## Organization & Governance

| # | Question | Source |
|---|----------|--------|
| GOV-01 | Do you have a documented information security policy? | POL-001 |
| GOV-02 | Is there a designated individual responsible for information security? | scope config, POL-001 |
| GOV-03 | Do you conduct annual risk assessments? | POL-003, evidence/reviews |
| GOV-04 | Do you have a security awareness training program? | POL-008, evidence/training |
| GOV-05 | How often is security training conducted? | POL-008 |
| GOV-06 | Do you carry cyber liability insurance? | scope config |
| GOV-07 | Do you have a governance or advisory board for security decisions? | scope config, POL-001 |

## Access Control

| # | Question | Source |
|---|----------|--------|
| AC-01 | Do you require multi-factor authentication for all users? | POL-002, CC5.1 |
| AC-02 | Do you enforce least-privilege access? | POL-002, CC5.1 |
| AC-03 | How often do you review user access rights? | POL-002, evidence/access-review |
| AC-04 | Do you have a process for revoking access when personnel leave? | POL-002 |
| AC-05 | Do you use role-based access control? | POL-002 |
| AC-06 | How do you manage privileged/admin accounts? | POL-002 |
| AC-07 | Do you have a password policy? What are the requirements? | POL-002 |
| AC-08 | Do you use a centralized identity provider (SSO)? | POL-002, inventory |

## Data Protection

| # | Question | Source |
|---|----------|--------|
| DP-01 | Do you encrypt data at rest? What algorithm/key length? | POL-004, CC6.1 |
| DP-02 | Do you encrypt data in transit? What protocols? | POL-004, CC6.1 |
| DP-03 | How do you manage encryption keys? | POL-004 |
| DP-04 | Do you have a data classification policy? | POL-004, agent-governance (data classification reference) |
| DP-05 | Do you have a data retention and disposal policy? | POL-004 |
| DP-06 | Where is customer data stored (region/country)? | scope config |
| DP-07 | Can you provide data residency guarantees? | scope config |
| DP-08 | Do you anonymize or pseudonymize personal data? | POL-004 |

## Network & Infrastructure

| # | Question | Source |
|---|----------|--------|
| NET-01 | Do you use firewalls or equivalent network security controls? | POL-005, CC6.1 |
| NET-02 | Do you segment your network by function/sensitivity? | POL-005 |
| NET-03 | Do you perform vulnerability scanning? How often? | POL-006 |
| NET-04 | Do you perform penetration testing? How often? | POL-006 |
| NET-05 | Do you have intrusion detection/prevention systems? | POL-005 |
| NET-06 | How do you manage patching and system updates? | POL-006 |
| NET-07 | What cloud provider(s) do you use? | scope config |
| NET-08 | Do you use container or serverless architectures? | inventory |

## Application Security

| # | Question | Source |
|---|----------|--------|
| APP-01 | Do you follow a secure software development lifecycle (SDLC)? | POL-006 |
| APP-02 | Do you perform code reviews? | POL-006 |
| APP-03 | Do you use automated security scanning in CI/CD? | POL-006, evidence/github |
| APP-04 | Do you scan dependencies for known vulnerabilities? | POL-006 |
| APP-05 | Do you have branch protection rules? | POL-006, evidence/github |
| APP-06 | How do you manage secrets and API keys? | POL-004, secrets inventory |

## Incident Response

| # | Question | Source |
|---|----------|--------|
| IR-01 | Do you have a documented incident response plan? | POL-009 |
| IR-02 | How quickly do you notify customers of a data breach? | POL-009 |
| IR-03 | Do you conduct post-incident reviews? | POL-009 |
| IR-04 | Do you test your incident response plan? How often? | POL-009, evidence |
| IR-05 | Who is the incident response contact? | POL-009, scope config |

## Business Continuity

| # | Question | Source |
|---|----------|--------|
| BC-01 | Do you have a business continuity plan? | POL-010 |
| BC-02 | Do you have a disaster recovery plan? | POL-010 |
| BC-03 | What is your RTO (Recovery Time Objective)? | POL-010 |
| BC-04 | What is your RPO (Recovery Point Objective)? | POL-010 |
| BC-05 | How often do you back up data? | POL-010 |
| BC-06 | Do you test backups and recovery procedures? | POL-010, evidence |

## Vendor Management

| # | Question | Source |
|---|----------|--------|
| VM-01 | Do you assess the security posture of your vendors? | POL-011 |
| VM-02 | Do you maintain a list of subprocessors? | POL-011, vendor inventory |
| VM-03 | Do you have data processing agreements with subprocessors? | POL-011 |
| VM-04 | Will you notify us before changing subprocessors? | DPA template |

## Change Management

| # | Question | Source |
|---|----------|--------|
| CM-01 | Do you have a change management process? | POL-007 |
| CM-02 | Are changes tested before deployment to production? | POL-007 |
| CM-03 | Do you maintain an audit trail of changes? | POL-007, CC7.1 |
| CM-04 | Do you have rollback procedures? | POL-007 |

## AI Agent Governance (Differentiator)

| # | Question | Source |
|---|----------|--------|
| AI-01 | Do you use AI agents in your operations? | agent registry |
| AI-02 | Are AI agents registered in a formal inventory? | agent registry |
| AI-03 | How do you classify AI agent risk? | agent-governance (risk tiers) |
| AI-04 | How do you govern AI agent data access? | agent registry (data access tables) |
| AI-05 | Do you test AI agents for prompt injection vulnerabilities? | agent-governance (blue team) |
| AI-06 | How do you classify trusted vs untrusted AI agent contexts? | agent-governance (context trust) |
| AI-07 | Are AI agent credentials managed and rotated? | agent registry (credentials) |
| AI-08 | Do AI agents have documented boundary constraints? | agent registry (boundaries) |
| AI-09 | How often are AI agent access permissions reviewed? | agent registry (review cadence) |
| AI-10 | Can AI agents access customer data? Under what controls? | agent registry (data access, exclusions) |

## Compliance & Audit

| # | Question | Source |
|---|----------|--------|
| CA-01 | Do you have a SOC 2 report? What type and scope? | dashboard, scope config |
| CA-02 | What TSC criteria are in scope? | scope config |
| CA-03 | When was your last audit? | scope config |
| CA-04 | Can you share your SOC 2 report under NDA? | (always Yes) |
| CA-05 | Do you have ISO 27001 certification? | scope config |
| CA-06 | Do you comply with GDPR? | POL-012 or equivalent |
| CA-07 | Do you have a privacy policy? | POL-012 |

## Solo-Company Specific

These questions frequently arise for very small companies. Proactively address them.

| # | Question | Source |
|---|----------|--------|
| SC-01 | How do you handle separation of duties with a small team? | POL-001 (compensating controls) |
| SC-02 | Who reviews the security reviewer? | POL-001 (external advisors, CI gates) |
| SC-03 | What happens if the primary person is unavailable? | POL-010 (continuity), scope config |
| SC-04 | How do you handle code review with a solo developer? | POL-006 (CI gates as compensating control) |
| SC-05 | Do you have external advisors for security governance? | scope config |
