---
classification: CONFIDENTIAL
distribution: NDA required prior to review
company: {{company_name}}
generated: {{generated_date}}
valid_until: {{valid_until_date}}
---

> **CONFIDENTIAL** — These documents are provided under non-disclosure agreement.
> Unauthorized distribution is prohibited. Valid until {{valid_until_date}}.

# {{company_name}} — Compliance Documentation Package

This package contains compliance documentation for {{company_name}}, generated from our compliance management system on {{generated_date}}.

## Contents

| Document | Description |
|----------|-------------|
| `compliance-summary.md` | Narrative overview of our compliance posture, including SOC 2 scope, control coverage, and audit readiness status |
| `security-questionnaire.md` | Pre-answered security questionnaire covering {{question_count}} common questions across {{domain_count}} security domains |
| `agent-governance-summary.md` | Overview of our AI agent governance framework, including context trust classification and control tiers |
| `dpa-template.md` | Data Processing Addendum template pre-populated with our security measures and processing details |

## SOC 2 Report

{{#if soc2_report_available}}
Our SOC 2 {{audit_type}} report covering {{tsc_scope}} is available upon request. Please contact {{security_contact}} to receive a copy.
{{else}}
Our SOC 2 compliance program is established and operational. Formal audit is {{audit_timeline}}.
{{/if}}

## Questions

For questions about these documents or to request additional information:

**Security Contact**: {{security_contact}}

## Validity

This documentation reflects our compliance posture as of {{generated_date}}. We regenerate these documents at least quarterly and after any material change to our compliance program. If this package is more than 90 days old, please request an updated version.
