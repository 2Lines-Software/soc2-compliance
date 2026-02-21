# SOC 2 Compliance Worker Framework

A lightweight SOC 2 compliance framework designed for very small companies (<5 people). Uses markdown documents as the data store, an MCP server as the agent interface, and Claude Code skills for automation.

## Why This Exists

SOC 2 compliance tools (Vanta, Drata, etc.) cost $10K+/year and are designed for companies with 50+ employees. If you're a solo developer or small team, you need something simpler:

- **Markdown-native**: All compliance data lives as version-controlled markdown files
- **Solo-company adapted**: Compensating controls, self-review checklists, and automation replace multi-person processes
- **Agent-powered**: AI agents handle evidence collection, policy generation, gap analysis, and audit readiness checks
- **MCP architecture**: Extensible to any tool via the Model Context Protocol

## TSC Scope

- **Security** (Common Criteria CC1-CC9): 35 sub-controls
- **Confidentiality** (C1): 6 sub-controls
- **Target**: SOC 2 Type I (point-in-time), with path to Type II

## Quick Start

```bash
# Install dependencies
npm install

# Build the MCP server
npm run build

# Run tests
npm test
```

### Register the MCP Server

Add to your Claude Code MCP configuration:

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

### Compliance Workflow

1. **`/compliance-init`** — Set up the framework for your company
2. **`/compliance-gap`** — Run a gap assessment against SOC 2 requirements
3. **`/compliance-policy`** — Generate tailored policies from the gap report
4. **`/compliance-evidence`** — Collect and organize evidence
5. **`/compliance-audit`** — Check audit readiness (pass/fail)

## Architecture

```
┌─────────────────────────────────────────────┐
│           KNOWLEDGE BASE (markdown)          │
│                                              │
│  compliance/controls/   - TSC control maps   │
│  compliance/config/     - Company scope       │
│  compliance/policies/   - Generated policies  │
│  compliance/evidence/   - Collected evidence  │
│  compliance/gaps/       - Gap analysis        │
│  compliance/assessments/- Readiness checks    │
└──────────┬───────────────────────────────────┘
           │
    ┌──────▼──────┐
    │  MCP SERVER  │  17 tools across 4 groups:
    │  (TypeScript) │  documents, controls,
    │  stdio        │  evidence, assessment
    └──────┬──────┘
           │
    ┌──────▼──────────────────────────────────┐
    │          CLAUDE CODE SKILLS              │
    │                                          │
    │  /compliance-init     Setup              │
    │  /compliance-gap      Gap assessment     │
    │  /compliance-policy   Policy generation  │
    │  /compliance-evidence Evidence collection│
    │  /compliance-audit    Readiness check    │
    └─────────────────────────────────────────┘
```

## MCP Tools (17)

### Document Management
| Tool | Description |
|------|-------------|
| `list_documents` | List docs by type with optional status filter |
| `read_document` | Read a document with parsed frontmatter |
| `create_document` | Create with YAML frontmatter metadata |
| `update_document` | Update content and/or metadata |
| `update_document_status` | Change lifecycle status |

### Control Management
| Tool | Description |
|------|-------------|
| `list_controls` | List controls, filter by criteria group |
| `get_control` | Get control details and evidence requirements |
| `get_control_coverage` | Coverage summary with percentages |
| `map_evidence_to_control` | Link evidence to a control |

### Evidence Management
| Tool | Description |
|------|-------------|
| `store_evidence` | Store evidence artifacts |
| `list_evidence` | List evidence by category or control |
| `get_evidence_manifest` | Full evidence manifest |
| `update_manifest` | Replace manifest content |

### Assessment
| Tool | Description |
|------|-------------|
| `run_gap_analysis` | Produce structured gap report |
| `run_readiness_check` | Validate audit readiness |
| `get_compliance_dashboard` | Summary dashboard |
| `get_remediation_roadmap` | Prioritized remediation plan |

## Templates

- **12 policy templates** (POL-001 through POL-012) with `{{placeholders}}`
- **5 evidence templates** for manual attestations (access review, vendor review, risk assessment, training, device attestation)
- **Gap report template** with standard structure

## Solo-Company Adaptations

Key compensating controls built into every template:

- **Separation of duties**: CI/CD gates (tests, lint, security scan) serve as independent verification
- **Access reviews**: Quarterly self-review checklists replace manager-led reviews
- **Security training**: Self-directed annual training with documented completion
- **Incident escalation**: External contacts (legal, insurance, vendors) replace internal escalation chain
- **Governance**: External advisors supplement single-person governance

## License

MIT
