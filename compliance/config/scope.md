---
id: CFG-001
title: Assessment Scope
status: draft
version: "1.0"
last_reviewed: null
next_review: null
---

# Assessment Scope

## Organization
- **Company**: {{company_name}}
- **Personnel count**: {{personnel_count}}
- **Assessment date**: {{assessment_date}}
- **Target frameworks**: SOC 2 Type I
- **TSC in scope**: Security, Confidentiality

## Key Personnel
| Name | Role | Email |
|------|------|-------|
| {{owner_name}} | Principal / Security Owner | {{owner_email}} |

## Environment Targets

### Cloud Providers
- **Provider**: {{cloud_provider}}
- **Account/Project**: {{cloud_account}}
- **Region(s)**: {{cloud_regions}}

### Identity Provider
- **Provider**: {{identity_provider}}
- **Domain**: {{idp_domain}}

### Source Control
- **Platform**: {{source_control_platform}}
- **Organization**: {{source_control_org}}
- **Key repositories**: {{key_repos}}

### CI/CD
- **Platform**: {{cicd_platform}}
- **Pipeline config**: {{pipeline_location}}

### Infrastructure
- **Services**: {{infrastructure_services}}

### Endpoint Devices
| Device | OS | Encryption | MDM |
|--------|----|-----------|----|
| {{device_name}} | {{device_os}} | {{encryption_status}} | {{mdm_provider}} |

### Key SaaS Tools
| Tool | Purpose | Data Sensitivity |
|------|---------|-----------------|
| {{saas_tool}} | {{purpose}} | {{sensitivity}} |

### Secrets Management
- **Provider**: {{secrets_provider}}
- **Key rotation policy**: {{rotation_policy}}

### Logging & Monitoring
- **Log aggregation**: {{log_provider}}
- **Alerting**: {{alert_provider}}
- **Retention period**: {{log_retention}}

## Data Classification

| Level | Description | Examples |
|-------|-------------|----------|
| **Critical** | Data whose compromise would cause severe business impact | {{critical_data_examples}} |
| **Sensitive** | Data requiring protection but lower impact if compromised | {{sensitive_data_examples}} |
| **Internal** | Business data not intended for public release | {{internal_data_examples}} |
| **Public** | Data intended for public consumption | {{public_data_examples}} |

## Excluded from Scope
- {{exclusions}}
