---
id: "EV-ACCESS-{{year}}-Q{{quarter}}"
title: "Quarterly Access Review — {{year}} Q{{quarter}}"
status: draft
tsc_criteria: [CC5.1, CC6.5]
collected_date: null
---

# Quarterly Access Review — {{year}} Q{{quarter}}

**Reviewer**: {{owner_name}}
**Review Date**: {{review_date}}
**Period Covered**: {{quarter_start}} to {{quarter_end}}

## Cloud IAM Review ({{cloud_provider}})

### Users
| User | MFA Enabled | Last Login | Roles | Action Needed |
|------|-------------|------------|-------|---------------|
| | | | | |

### Service Accounts
| Account | Purpose | Key Age (days) | Scopes | Action Needed |
|---------|---------|----------------|--------|---------------|
| | | | | |

### Findings
- [ ] All users have MFA enabled
- [ ] No unused accounts found
- [ ] No excessive permissions found
- [ ] All service account keys < 90 days old
- [ ] No wildcard IAM policies

## Identity Provider Review ({{identity_provider}})

### OAuth App Authorizations
| App | Scopes Granted | Still Needed? | Action |
|-----|---------------|---------------|--------|
| | | | |

### Findings
- [ ] All OAuth grants reviewed
- [ ] Unnecessary grants revoked
- [ ] Password policy unchanged and adequate

## Source Control Review ({{source_control_platform}})

### Collaborators
| User | Access Level | Still Needed? | Action |
|------|-------------|---------------|--------|
| | | | |

### Deploy Keys / Webhooks
| Item | Purpose | Still Needed? | Action |
|------|---------|---------------|--------|
| | | | |

### Findings
- [ ] All collaborators reviewed
- [ ] No unnecessary access grants
- [ ] Deploy keys reviewed

## API Keys and Tokens

| Key/Token | Service | Age (days) | Rotated? | Action |
|-----------|---------|------------|----------|--------|
| | | | | |

## Summary

- **Total items reviewed**: {{count}}
- **Actions taken**: {{actions_summary}}
- **Next review due**: {{next_review_date}}
