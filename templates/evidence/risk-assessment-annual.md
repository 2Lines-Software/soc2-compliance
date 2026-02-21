---
id: "EV-RISK-{{year}}"
title: "Annual Risk Assessment — {{year}}"
status: draft
tsc_criteria: [CC3.1, CC3.2, CC3.3, CC3.4]
collected_date: null
---

# Annual Risk Assessment — {{year}}

**Assessor**: {{owner_name}}
**Assessment Date**: {{assessment_date}}
**Methodology**: Likelihood x Impact Matrix (see Risk Assessment Policy, POL-006)

## Risk Register

| # | Risk Description | Category | Likelihood | Impact | Score | Current Controls | Treatment | Residual Risk |
|---|-----------------|----------|------------|--------|-------|-----------------|-----------|---------------|
| 1 | | External | | | | | Mitigate | |
| 2 | | Internal | | | | | | |
| 3 | | Technology | | | | | | |
| 4 | | Vendor | | | | | | |

### Scoring Key

**Likelihood**: Unlikely (1), Possible (2), Likely (3)
**Impact**: Low (1), Medium (2), High (3)
**Score**: Likelihood x Impact

| Score | Rating | Response Required |
|-------|--------|-------------------|
| 7-9 | Critical | Immediate remediation |
| 4-6 | High | Remediation within 30 days |
| 2-3 | Medium | Remediation within 90 days |
| 1 | Low | Accept or monitor |

## External Threats Considered

- [ ] Supply chain attacks (dependency compromise)
- [ ] Credential theft (phishing, credential stuffing)
- [ ] API abuse (rate limiting, injection)
- [ ] DDoS attacks
- [ ] Ransomware
- [ ] Regulatory changes

## Internal Risks Considered

- [ ] Single point of failure (key person dependency)
- [ ] Configuration errors
- [ ] Accidental data exposure
- [ ] Insider threat (contractors)
- [ ] Knowledge loss

## Technology Risks Considered

- [ ] Cloud service outage
- [ ] Data corruption/loss
- [ ] Software vulnerabilities (zero-days)
- [ ] Encryption key compromise
- [ ] API breaking changes

## Changes Since Last Assessment

- New services deployed: {{new_services}}
- New integrations: {{new_integrations}}
- Architectural changes: {{arch_changes}}
- Personnel changes: {{personnel_changes}}

## Summary

- **Total risks identified**: {{count}}
- **Critical/High risks**: {{high_count}}
- **Risks accepted**: {{accepted_count}}
- **New risks since last assessment**: {{new_count}}
- **Next assessment due**: {{next_date}}
