---
classification: CONFIDENTIAL
distribution: NDA required prior to review
company: {{company_name}}
generated: {{generated_date}}
valid_until: {{valid_until_date}}
---

> **CONFIDENTIAL** — This document is provided under non-disclosure agreement.
> Unauthorized distribution is prohibited. Valid until {{valid_until_date}}.

# Compliance Summary

## Program Overview

{{company_name}} maintains a SOC 2 compliance program covering the {{tsc_scope}} Trust Services Criteria. Our compliance framework uses a markdown-native, version-controlled knowledge base with AI agent automation for evidence collection, gap analysis, and readiness monitoring.

**Audit Status**: {{audit_status}}
**Audit Type**: {{audit_type}}
**TSC Scope**: {{tsc_scope}}
{{#if audit_date}}**Last Audit**: {{audit_date}}{{/if}}
{{#if audit_period}}**Audit Period**: {{audit_period}}{{/if}}

## Control Coverage

| Criteria Group | Controls | Met | Partially Met | Not Met | Coverage |
|---------------|----------|-----|---------------|---------|----------|
{{control_coverage_table}}
| **Total** | **{{total_controls}}** | **{{total_met}}** | **{{total_partial}}** | **{{total_not_met}}** | **{{total_coverage}}%** |

## Policy Inventory

| Policy ID | Title | Status | Last Reviewed |
|-----------|-------|--------|---------------|
{{policy_table}}

## Readiness Status

{{#if readiness_passed}}
✅ **Audit-ready** — All required controls are met or have documented compensating controls.
{{else}}
⚠️ **Remediation in progress** — {{remediation_summary}}
{{/if}}

### Readiness by Area

{{readiness_by_area}}

## Remediation Roadmap

{{#if has_open_items}}
| Priority | Category | Target Date | Status |
|----------|----------|-------------|--------|
{{remediation_table}}
{{else}}
No open remediation items.
{{/if}}

## AI Agent Governance

### Agent Inventory

| Count | Context Classification | Risk Tier Distribution |
|-------|----------------------|----------------------|
| {{agent_count}} registered agents | {{trusted_count}} trusted, {{untrusted_count}} untrusted | {{tier_distribution}} |

### Governance Framework

All agents operate under a formal governance framework with:
- **Agent Registry**: Each agent has a documented identity, data access scope, tool inventory, action permissions, and explicit boundary constraints
- **Context Trust Classification**: Agents classified as trusted (internal data only) or untrusted (external data in context), with different control tiers applied
- **Control Tiers**: Tier 1 operational controls for all agents; Tier 2 adversarial controls added for untrusted-context agents
- **Review Cadence**: {{review_cadence_summary}}
- **Credential Management**: Credentials stored in secrets manager with {{credential_rotation}} rotation

{{#if untrusted_agents_exist}}
### Blue Team Testing

Untrusted-context agents undergo adversarial testing covering:
- Prompt injection
- Data exfiltration
- Tool abuse
- Context poisoning
- Privilege escalation

**Last test**: {{blue_team_last}}
**Next scheduled**: {{blue_team_next}}
{{/if}}

## Solo-Company Compensating Controls

As a {{company_size}} organization, the following compensating controls are in place:

| Standard Control | Compensating Control | Rationale |
|-----------------|---------------------|-----------|
| Multi-person code review | CI/CD gates (automated tests, lint, security scan) | Independent automated verification replaces human reviewer |
| Manager-led access reviews | Quarterly self-review checklists with documented evidence | Structured process with audit trail replaces multi-person review |
| Dedicated security team | External advisors + automated monitoring | Advisory relationship supplements single-person security function |
| Tiered incident escalation | External escalation contacts (legal, insurance, vendors) | Defined external contacts replace internal escalation chain |
| Security awareness training program | Self-directed annual training with documented completion | Individual accountability with evidence replaces classroom training |

## Evidence Collection

Evidence is collected and organized as follows:

| Frequency | Evidence Type |
|-----------|--------------|
| Continuous | Cloud audit logs, GitHub activity |
| Weekly | Login audit events |
| Monthly | Full IAM snapshot, dependency vulnerability scan |
| Quarterly | Access review, vendor risk review, agent registry review |
| Annually | Full risk assessment, policy review, security training |

Evidence is stored in the compliance knowledge base under version control with timestamps and provenance tracking.
