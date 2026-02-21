# SOC 2 Compliance Worker Framework

An open-source, agent-powered SOC 2 compliance framework for small companies (<5 people). Clone this repo, point it at your infrastructure, and let AI agents generate your policies, collect evidence, and tell you exactly what's left before you're audit-ready.

Everything lives as markdown files in a git repo. No SaaS platform. No $10K/year subscription. No vendor lock-in.

## How It Works

This framework has three layers:

1. **Markdown knowledge base** — SOC 2 control mappings, your company config, generated policies, collected evidence, gap reports, and readiness assessments. All version-controlled, all human-readable.

2. **MCP server** — A local TypeScript server that gives AI agents structured access to your compliance data (17 tools for reading/writing documents, tracking controls, managing evidence, and running assessments).

3. **Claude Code skills** — Five agent workflows that use the MCP tools to automate the compliance lifecycle: initialize, assess gaps, generate policies, collect evidence, and check audit readiness.

```
┌──────────────────────────────────────────────────────────────┐
│                YOUR INFRASTRUCTURE                            │
│                                                               │
│  GitHub ─── AWS/GCP ─── Google Workspace ─── Secrets Mgr     │
│     │           │              │                  │           │
│     └───────────┴──────────────┴──────────────────┘           │
│                         │                                     │
│                    MCP connections                             │
│                    (optional — the more you                    │
│                     connect, the more the                      │
│                     agents can automate)                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│  COMPLIANCE FRAMEWORK (this repo)                             │
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Knowledge Base  │  │  MCP Server   │  │  Agent Skills   │ │
│  │  (markdown)      │◄─┤  (17 tools)   │◄─┤  (5 workflows)  │ │
│  │                  │  │              │  │                 │ │
│  │  controls/       │  │  documents   │  │  /compliance-   │ │
│  │  policies/       │  │  controls    │  │    init         │ │
│  │  evidence/       │  │  evidence    │  │    gap          │ │
│  │  gaps/           │  │  assessment  │  │    policy       │ │
│  │  assessments/    │  │              │  │    evidence     │ │
│  │  config/         │  │              │  │    audit        │ │
│  └─────────────────┘  └──────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**The key idea:** The agents are designed to do as much as they can automatically — and ask you for the rest. Connect more infrastructure MCPs and they automate more. Connect none and they walk you through everything interactively.

## Quick Start

```bash
# 1. Clone and install
git clone <this-repo>
cd compliance-worker-framework
npm install && npm run build

# 2. Register the MCP server with Claude Code
#    Add to .claude/settings.json or your MCP config:
```

```json
{
  "mcpServers": {
    "soc2-compliance": {
      "command": "node",
      "args": ["<path-to-repo>/dist/index.js"],
      "env": {
        "COMPLIANCE_ROOT": "<path-to-repo>/compliance"
      }
    }
  }
}
```

```bash
# 3. Run the compliance workflow
/compliance-init        # Set up for your company
/compliance-gap         # Assess current state against SOC 2
/compliance-policy      # Generate tailored policies
/compliance-evidence    # Collect and organize proof
/compliance-audit       # Check: are you audit-ready?
```

That's it. Your compliance state lives in `compliance/` as markdown, versioned in git alongside your code.

## What the Agents Do

| Skill | What It Does | Output |
|-------|-------------|--------|
| `/compliance-init` | Asks about your company, stack, and environment. Populates the scope config. | `compliance/config/scope.md` |
| `/compliance-gap` | 4-phase assessment: discover your environment, map to SOC 2 controls, score each control, produce a prioritized gap report. | `compliance/gaps/gap-analysis-YYYY-MM-DD.md` |
| `/compliance-policy` | Reads the gap report, generates tailored policies that reference your actual tools and configs. Not generic templates — policies specific to your stack. | `compliance/policies/*.md` |
| `/compliance-evidence` | Collects evidence from connected MCPs (GitHub, cloud, IdP). Prompts for manual attestations where automation isn't available. | `compliance/evidence/` + manifest |
| `/compliance-audit` | Validates everything is in place: policies approved, evidence collected, gaps resolved. Clear pass/fail with action items. | `compliance/assessments/readiness-check-YYYY-MM-DD.md` |
| `/compliance-agents` | Register AI agents, classify context trust, audit against AGT controls, check credential rotation. Optional add-on for orgs using AI agents. | `compliance/agents/AGENT-*.md` |

## Agent Governance (Optional Add-On)

If you use AI agents in your organization, the framework includes an optional agent governance module. This is ahead of most SOC 2 programs — auditors are starting to ask about AI agent controls, and this gives you the answer.

**The core concept is context trust:**
- **Trusted context**: All LLM input comes from org-controlled sources. Operational risk only.
- **Untrusted context**: Any LLM input comes from outside the org. Adversarial risk applies.

This classification determines which controls apply:
- **Tier 1 (AGT-01 to AGT-10)**: All agents — registration, access scope, credentials, logging, reviews
- **Tier 2 (AGT-11 to AGT-19)**: Untrusted agents only — input validation, prompt injection defenses, blue team testing

Run `/compliance-agents` to register agents, audit compliance, and check credential rotation. See `AGENT-GOVERNANCE-FRAMEWORK.md` for the full design.

## Infrastructure Discovery (Built-in)

The MCP server includes built-in infrastructure discovery tools that wrap CLIs you already have installed. No third-party MCP packages needed — just your existing CLIs with your existing authentication.

| CLI / Auth | Tools | What It Checks | Controls |
|------------|-------|---------------|----------|
| **`gh`** | `gh_auth_status`, `gh_branch_protection`, `gh_repo_security`, `gh_collaborators`, `gh_workflows` | Branch protection, secret scanning, Dependabot, collaborator access, CI/CD workflows | CC5.1, CC5.2, CC7.1, CC8.1 |
| **`aws`** | `aws_auth_status`, `aws_iam_mfa_status`, `aws_cloudtrail_status`, `aws_s3_encryption`, `aws_kms_keys`, `aws_security_groups`, `aws_backup_config` | IAM users & MFA, CloudTrail, S3 encryption, KMS rotation, security groups, backups | CC5.1, CC6.1, CC6.2, CC6.6, CC7.1, CC7.3 |
| **`gcloud`** | `gcloud_auth_status`, `gcloud_iam_policy`, `gcloud_service_accounts`, `gcloud_logging_sinks`, `gcloud_kms_keys`, `gcloud_firewall_rules` | IAM policies, service accounts, logging sinks, KMS keys, firewall rules | CC5.1, CC6.1, CC6.6, CC7.1 |
| **`gam`** | `gam_auth_status`, `gam_users`, `gam_mfa_status`, `gam_admin_roles`, `gam_login_audit` | Workspace user directory, 2-step verification, admin roles, login audit | CC5.1, CC6.2, CC7.1 |
| **`curl`** + `CF_API_TOKEN` | `cf_auth_status`, `cf_zones`, `cf_ssl_tls`, `cf_waf_rules`, `cf_security_settings` | SSL/TLS mode, WAF rules, HTTPS enforcement, security level | CC6.1, CC6.6 |
| **`terraform`** | `tf_version`, `tf_state_resources`, `tf_workspace`, `tf_providers` | IaC resource inventory, workspace separation, provider coverage | CC8.1 |

**How it works:** Each tool shells out to the CLI, parses the output, and returns structured findings mapped to TSC controls. All tools are read-only. Auth is your responsibility — the framework never stores or manages credentials.

**Without any CLIs installed**, the agents still work — they just ask you questions instead of pulling data automatically. Install and authenticate CLIs as you go.

## TSC Scope

- **Security** (Common Criteria CC1-CC9): 35 sub-controls
- **Confidentiality** (C1): 6 sub-controls
- **Target**: SOC 2 Type I (point-in-time), with path to Type II

## What's in the Box

### Control Mappings (41 sub-controls)
Pre-built reference for every SOC 2 control in scope. Each control includes:
- What the auditor looks for
- Evidence types needed
- MCP discovery targets (what to collect automatically)
- Solo-company notes and compensating controls

### Policy Templates (12)
Auditor-ready policy structures with `{{placeholders}}` for your environment:

| # | Policy | Controls |
|---|--------|----------|
| 1 | Information Security Policy | CC1.1, CC2.1 |
| 2 | Access Control Policy | CC5.1, CC6.1-CC6.5 |
| 3 | Encryption Policy | CC6.1 |
| 4 | Change Management Policy | CC8.1-CC8.3 |
| 5 | Incident Response Plan | CC7.2 |
| 6 | Risk Assessment Policy | CC3.1-CC3.4 |
| 7 | Vendor Management Policy | CC9.1 |
| 8 | Data Classification Policy | CC6.1, C1.1 |
| 9 | Acceptable Use Policy | CC1.1 |
| 10 | Business Continuity / DR Policy | CC7.3-CC7.4 |
| 11 | Confidentiality Policy | C1.1, C1.2 |
| 12 | Logging & Monitoring Policy | CC7.1, CC4.1 |

### Evidence Templates (5)
Structured templates for manual attestations:
- Quarterly access review
- Quarterly vendor review
- Annual risk assessment
- Annual training completion
- Device security attestation

### MCP Server (54 tools)
| Group | Tools |
|-------|-------|
| Documents | `list_documents`, `read_document`, `create_document`, `update_document`, `update_document_status` |
| Controls | `list_controls`, `get_control`, `get_control_coverage`, `map_evidence_to_control` |
| Evidence | `store_evidence`, `list_evidence`, `get_evidence_manifest`, `update_manifest` |
| Assessment | `run_gap_analysis`, `run_readiness_check`, `get_compliance_dashboard`, `get_remediation_roadmap` |
| Agents | `list_agents`, `get_agent`, `get_agent_coverage`, `check_credential_rotation`, `run_agent_audit` |
| GitHub | `gh_auth_status`, `gh_branch_protection`, `gh_repo_security`, `gh_collaborators`, `gh_workflows` |
| AWS | `aws_auth_status`, `aws_iam_mfa_status`, `aws_cloudtrail_status`, `aws_s3_encryption`, `aws_kms_keys`, `aws_security_groups`, `aws_backup_config` |
| GCloud | `gcloud_auth_status`, `gcloud_iam_policy`, `gcloud_service_accounts`, `gcloud_logging_sinks`, `gcloud_kms_keys`, `gcloud_firewall_rules` |
| Workspace | `gam_auth_status`, `gam_users`, `gam_mfa_status`, `gam_admin_roles`, `gam_login_audit` |
| Cloudflare | `cf_auth_status`, `cf_zones`, `cf_ssl_tls`, `cf_waf_rules`, `cf_security_settings` |
| Terraform | `tf_version`, `tf_state_resources`, `tf_workspace`, `tf_providers` |

## Solo-Company Adaptations

Every control mapping, policy template, and agent workflow includes adaptations for 1-5 person companies:

- **Separation of duties** → CI/CD gates (tests, lint, security scan) serve as independent verification
- **Access reviews** → Quarterly self-review checklists replace manager-led reviews
- **Security training** → Self-directed annual training with documented completion
- **Incident escalation** → External contacts (legal, insurance, vendors) replace internal chain
- **Governance** → External advisors supplement single-person governance

These aren't workarounds — they're legitimate compensating controls that auditors accept for small organizations.

## Roadmap

- [x] Infrastructure CLI integrations (AWS, GCP, GitHub)
- [ ] Automated evidence collection on a schedule (for Type II)
- [ ] Additional TSC criteria (Availability, Processing Integrity, Privacy)
- [ ] Pre-built Plaid/Stripe security questionnaire mappings
- [ ] Multi-framework support (ISO 27001, HIPAA)

## Contributing

Contributions welcome. The most impactful additions are:
1. **Infrastructure MCP integrations** — connect to real cloud/identity/SCM providers
2. **Additional TSC criteria** — expand beyond Security + Confidentiality
3. **Evidence collection automations** — more things the agents can discover without asking

## Disclaimer

This project provides tooling and templates to assist with SOC 2 compliance management. It does not constitute professional advice and does not guarantee compliance with any framework. All generated policies, questionnaire responses, and Trust Center content must be reviewed by qualified professionals before use. See [DISCLAIMER.md](DISCLAIMER.md) for full details.

## License

MIT — see [LICENSE](LICENSE).