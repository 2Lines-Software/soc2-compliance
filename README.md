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

## Connecting Infrastructure MCPs

The more MCPs you connect, the more the agents can discover and collect automatically:

| MCP | What It Unlocks | Controls Covered |
|-----|----------------|-----------------|
| **GitHub** | Branch protection, CI/CD config, collaborator access, secret scanning, Dependabot | CC5.1, CC5.2, CC7.1, CC8.1 |
| **AWS / GCP / Azure** | IAM users & MFA, encryption config, network rules, logging, backups | CC5.1, CC6.1, CC6.6, CC7.1, CC7.3 |
| **Google Workspace / Okta** | User directory, MFA status, password policy, login audit | CC5.1, CC6.2, CC7.1 |
| **Secrets Manager** | Secret inventory (names only), rotation dates | CC6.1 |
| **Endpoint MDM** | Device encryption, OS patches, firewall status | CC5.1, CC6.1, CC6.8 |

**Without any infrastructure MCPs**, the agents still work — they just ask you questions instead of pulling data automatically. You can start with zero MCPs and add them over time.

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

### MCP Server (17 tools)
| Group | Tools |
|-------|-------|
| Documents | `list_documents`, `read_document`, `create_document`, `update_document`, `update_document_status` |
| Controls | `list_controls`, `get_control`, `get_control_coverage`, `map_evidence_to_control` |
| Evidence | `store_evidence`, `list_evidence`, `get_evidence_manifest`, `update_manifest` |
| Assessment | `run_gap_analysis`, `run_readiness_check`, `get_compliance_dashboard`, `get_remediation_roadmap` |

## Solo-Company Adaptations

Every control mapping, policy template, and agent workflow includes adaptations for 1-5 person companies:

- **Separation of duties** → CI/CD gates (tests, lint, security scan) serve as independent verification
- **Access reviews** → Quarterly self-review checklists replace manager-led reviews
- **Security training** → Self-directed annual training with documented completion
- **Incident escalation** → External contacts (legal, insurance, vendors) replace internal chain
- **Governance** → External advisors supplement single-person governance

These aren't workarounds — they're legitimate compensating controls that auditors accept for small organizations.

## Roadmap

- [ ] Infrastructure MCP integrations (AWS, GCP, GitHub)
- [ ] Automated evidence collection on a schedule (for Type II)
- [ ] Additional TSC criteria (Availability, Processing Integrity, Privacy)
- [ ] Pre-built Plaid/Stripe security questionnaire mappings
- [ ] Multi-framework support (ISO 27001, HIPAA)

## Contributing

Contributions welcome. The most impactful additions are:
1. **Infrastructure MCP integrations** — connect to real cloud/identity/SCM providers
2. **Additional TSC criteria** — expand beyond Security + Confidentiality
3. **Evidence collection automations** — more things the agents can discover without asking

## License

MIT
