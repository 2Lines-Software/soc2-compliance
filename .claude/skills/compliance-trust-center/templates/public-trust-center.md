# {{company_name}} Trust Center

_Last updated: {{generated_date}}_

## Compliance Status

{{#if audit_completed}}
| Framework | Scope | Type | Status | Period |
|-----------|-------|------|--------|--------|
| SOC 2 | {{tsc_scope}} | {{audit_type}} | {{audit_status}} | {{audit_period}} |
{{else}}
| Framework | Scope | Status |
|-----------|-------|--------|
| SOC 2 | {{tsc_scope}} | Program established, audit {{audit_timeline}} |
{{/if}}

{{#if additional_frameworks}}
{{additional_frameworks_table}}
{{/if}}

## Security Practices

### Access Control

We enforce strict access controls across all systems. All user accounts require multi-factor authentication. Access is granted on a least-privilege basis and reviewed quarterly. Administrative access requires additional approval and is logged.

{{access_control_details}}

### Encryption

All data is encrypted in transit using TLS 1.2 or higher. Data at rest is encrypted using AES-256 or equivalent. Encryption keys are managed through a dedicated secrets management service with automated rotation.

{{encryption_details}}

### Network Security

Our infrastructure uses network segmentation to isolate systems by function and sensitivity. All inbound traffic is filtered through managed firewall services. We monitor network activity for anomalous behavior and maintain audit logs of all access.

{{network_details}}

### Monitoring & Logging

We maintain comprehensive audit logs across all systems. Logs are retained for {{log_retention_period}} and monitored for security-relevant events. We use automated alerting for anomalous activity and conduct regular log reviews.

{{monitoring_details}}

### Vulnerability Management

We perform regular vulnerability scanning across our infrastructure and applications. Dependencies are monitored for known vulnerabilities and patched according to severity-based timelines. Critical vulnerabilities are addressed within {{critical_vuln_sla}}.

{{vulnerability_details}}

## Software Development

We follow secure development practices including version-controlled source code, automated testing, code review requirements, and staged deployments. Security scanning is integrated into our CI/CD pipeline.

{{sdlc_details}}

## Data Handling

### Data Residency

{{data_residency}}

### Data Retention

{{data_retention}}

### Data Classification

We classify all data by sensitivity level and apply controls proportional to classification. Our classification scheme includes Public, Internal, Sensitive, and Critical categories, each with defined access rules and handling requirements.

## AI Agent Governance

We operate AI agents as part of our technology workforce and govern them under a formal agent governance framework.

### Context Trust Classification

Every agent is classified by the trust level of its input context. Agents processing only internally-controlled data operate under operational controls. Agents receiving any externally-originated content are subject to additional adversarial controls including input validation, output filtering, and prompt injection defenses.

### Agent Risk Tiers

Agents are classified into five risk tiers based on the maximum impact of their permitted actions, from read-only observers to transaction-capable agents. Higher-tier agents receive more frequent reviews and tighter approval gates.

### Agent Controls

All agents are registered in a central inventory documenting their identity, data access scope, tool access, action permissions, and explicit boundary constraints. Agents are reviewed on a cadence determined by their risk tier, with credential rotation enforced on a {{credential_rotation}} schedule.

{{#if untrusted_agents_exist}}
Agents operating with untrusted context undergo blue team testing on a quarterly basis, covering prompt injection, data exfiltration, tool abuse, and privilege escalation scenarios.
{{/if}}

## Incident Response

We maintain a documented incident response plan covering detection, containment, eradication, recovery, and post-incident review. In the event of a security incident affecting client data, we commit to notification within {{incident_notification_sla}}.

{{incident_response_details}}

## Business Continuity

{{business_continuity_details}}

## Subprocessors

{{#if subprocessors}}
| Subprocessor | Purpose | Data Access |
|-------------|---------|-------------|
{{subprocessor_table}}
{{else}}
We maintain a subprocessor inventory and conduct vendor risk assessments for all third-party services that process data on our behalf. Contact us for the current subprocessor list.
{{/if}}

## Request Documentation

To request our SOC 2 report, completed security questionnaire, or other compliance documentation, please contact us. These documents are available under mutual NDA.

**Security Contact**: {{security_contact}}

{{#if trust_center_url}}
**Request Form**: {{trust_center_url}}
{{/if}}

---

_This Trust Center is generated from our compliance management system and reflects our current control posture. It is updated at least quarterly and after any material change to our compliance program._
