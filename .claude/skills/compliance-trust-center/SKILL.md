---
name: compliance-trust-center
description: Generate a public-facing Trust Center page and gated compliance document package from the SOC 2 compliance knowledge base. Use when the user says "generate trust center", "create trust center", "build security page", "compliance-trust-center", "create the public compliance page", "export compliance package for a client", "generate NDA documents", or any request to produce a client-facing or public-facing summary of their compliance posture. Also trigger when the user asks about sharing compliance information with clients, prospects, or partners.
---

# Compliance Trust Center Generator

Generate a two-layer Trust Center from your SOC 2 compliance knowledge base: a public page anyone can see, and a gated document package shared under NDA.

## Core Principle

The Trust Center is a **projection** of your compliance posture, not a portal into it. The compliance knowledge base is the source of truth. The Trust Center is a derived, filtered, curated output. Never expose raw compliance files, evidence paths, credential IDs, infrastructure details, or internal gap analysis to the public layer.

## Architecture

```
compliance/ (source of truth - NEVER shared directly)
    │
    ├──► PUBLIC LAYER (Trust Center page)
    │    Markdown or HTML. No auth required.
    │    Contains: commitments, certifications, high-level practices.
    │    Excludes: implementation details, infrastructure, tooling specifics.
    │
    └──► GATED LAYER (NDA document package)
         Exported as individual documents or bundled zip.
         Shared under NDA only.
         Contains: sanitized SOC 2/3 summary, completed questionnaire,
                   DPA template, architecture overview, agent governance summary.
```

## Prerequisites

This skill requires the `soc2-compliance` MCP server to be registered and accessible. The skill reads compliance data through MCP tools:

- `get_compliance_dashboard` — overall compliance status
- `get_control_coverage` — control coverage percentages
- `list_documents` — enumerate policies, agents, evidence
- `read_document` — read individual policy/agent documents
- `run_readiness_check` — current audit readiness
- `get_remediation_roadmap` — open items (gated layer only)

If the MCP server is not connected, fall back to reading compliance markdown files directly from the filesystem at the path specified by the user (typically `./compliance/`).

## Workflow

### Step 1: Gather Compliance State

Collect the data needed to populate both layers.

```
# Via MCP tools (preferred):
get_compliance_dashboard          → overall scores, status
get_control_coverage              → per-criteria coverage %
list_documents type=policies      → all policies and their status
list_documents type=agents        → all registered agents
run_readiness_check               → pass/fail by control area
list_evidence                     → evidence inventory

# Via filesystem fallback:
ls compliance/config/             → scope definition
ls compliance/policies/           → policy inventory
ls compliance/agents/             → agent registry
ls compliance/controls/           → control mappings
ls compliance/gaps/               → gap status (GATED ONLY)
ls compliance/evidence/           → evidence inventory (GATED ONLY)
```

### Step 2: Read Configuration

Read the scope configuration to determine:
- Company name
- TSC criteria in scope (Security, Confidentiality, etc.)
- System description
- Audit type (Type I / Type II)
- Audit period (if Type II)
- Last audit date (if completed)

```
read_document type=config id=scope
# or: cat compliance/config/scope.md
```

### Step 3: Generate Public Layer

Use the public layer template at `templates/public-trust-center.md`. 

**Populate these sections from compliance data:**

| Section | Source | What to Include | What to EXCLUDE |
|---------|--------|-----------------|-----------------|
| Compliance Status | dashboard, readiness | Certification name, scope, date, pass/fail | Scores, percentages, specific findings |
| Security Practices | policies (POL-001 through POL-012) | Practice commitments in plain language | Policy document content, tool names, config details |
| Data Handling | scope config, confidentiality controls | Where data resides (region), encryption standards, retention | Specific cloud providers, bucket names, service accounts |
| Agent Governance | agent registry | Number of agents, classification framework, control tiers | Agent IDs, credential IDs, MCP names, tool permissions |
| Incident Response | POL-009 or equivalent | Commitment to notification timelines | Internal escalation contacts, playbook details |
| Subprocessors | vendor inventory if available | Vendor names and purposes | Contract details, risk assessments |
| Contact | scope config | Security contact email/form | Internal contacts |

**Sanitization rules for public layer:**
- NO credential IDs, secret names, or rotation schedules
- NO infrastructure identifiers (project IDs, account IDs, bucket names, VPC names)
- NO specific tool names or MCP server identifiers
- NO gap analysis results or remediation items
- NO evidence file paths or artifact references
- NO internal IP addresses, endpoints, or URLs
- NO personnel names other than the security contact
- NO audit findings or auditor observations
- Rewrite technical controls as **commitments** ("We encrypt data at rest using AES-256" not "S3 buckets configured with SSE-KMS using key arn:aws:kms:...")

**Writing style for public layer:**
- Write as the company ("We"), not as a compliance framework
- Plain English, no jargon unless standard (SOC 2, TSC, MFA)
- Present tense commitments, not implementation descriptions
- Short paragraphs, scannable sections
- Professional but not legalistic

### Step 4: Generate Gated Layer

The gated layer produces individual documents, each saved separately. These are shared under NDA only.

#### Document 1: Compliance Summary (compliance-summary.md)

A narrative summary of the compliance posture. More detail than the public page but still sanitized.

**Include:**
- TSC scope and criteria coverage percentages
- Control areas and their status (met/partially met/not met counts)
- Audit readiness status
- Remediation roadmap summary (categories and timelines, not specific gaps)
- Agent governance framework overview with risk tier distribution
- Context trust classification methodology summary

**Exclude:**
- Specific gap details (which controls failed)
- Evidence artifacts
- Credential or infrastructure details

#### Document 2: Security Questionnaire (security-questionnaire.md)

Pre-answered common security questionnaire based on compliance data. Use the reference at `references/common-questions.md` for the question set.

**Populate answers from:**
- Policies (encryption, access control, incident response, etc.)
- Control coverage (which controls are met)
- Agent registry (how AI agents are governed)
- Scope config (data handling, infrastructure region)

**Answer style:**
- Direct, factual, reference specific policy IDs (e.g., "Per our Information Security Policy (POL-001)...")
- Include "Yes/No" prefix where questions are binary
- Note compensating controls for solo-company adaptations

#### Document 3: Agent Governance Summary (agent-governance-summary.md)

This is the differentiator document. Most companies don't have this.

**Include:**
- Context trust classification framework (trusted vs untrusted)
- Risk tier definitions (Tier 1-5)
- Control matrix (Tier 1 operational, Tier 2 adversarial)
- Number of registered agents and their tier distribution
- Agent review cadence
- Blue team testing status for untrusted-context agents

**Exclude:**
- Specific agent names and IDs
- MCP server configurations
- Credential IDs and rotation details
- Specific tool permissions

#### Document 4: Data Processing Addendum Template (dpa-template.md)

A template DPA based on the compliance scope. Use the template at `templates/dpa-template.md`.

**Populate from scope config:**
- Data categories processed
- Processing purposes
- Data retention periods
- Security measures summary
- Subprocessor list

### Step 5: Package and Deliver

```bash
# Create output directory (project-relative)
mkdir -p ./trust-center/public
mkdir -p ./trust-center/gated

# Public layer
cp public-trust-center.md ./trust-center/public/

# Gated layer (individual files)
cp compliance-summary.md ./trust-center/gated/
cp security-questionnaire.md ./trust-center/gated/
cp agent-governance-summary.md ./trust-center/gated/
cp dpa-template.md ./trust-center/gated/

# Optional: create a zip bundle for the gated layer
cd ./trust-center/gated
zip ../gated-compliance-package.zip *.md
```

### Step 6: Add NDA Header to Gated Documents

Prepend every gated document with:

```markdown
---
classification: CONFIDENTIAL
distribution: NDA required prior to review
company: {{company_name}}
generated: {{date}}
valid_until: {{date + 12 months}}
---

> **CONFIDENTIAL** — This document is provided under non-disclosure agreement.
> Unauthorized distribution is prohibited. Valid until {{valid_until}}.
```

## Output Files

```
trust-center/
├── public/
│   └── trust-center.md            # Public-facing Trust Center page
└── gated/
    ├── compliance-summary.md      # Detailed compliance posture (NDA)
    ├── security-questionnaire.md  # Pre-answered questionnaire (NDA)
    ├── agent-governance-summary.md # Agent framework overview (NDA)
    ├── dpa-template.md            # Data processing addendum (NDA)
    └── README.md                  # Index of gated documents
```

## Updating

The Trust Center should be regenerated:
- After any audit (Type I or Type II)
- After material changes to compliance posture
- After adding/removing agents from registry
- At least quarterly to match review cadence
- After any security incident that changes control status

Add this to the evidence manifest as a generated artifact:
```
map_evidence_to_control control=CC2.3 evidence_type=trust-center
```

CC2.3 (Communication with External Parties) is directly satisfied by maintaining an up-to-date Trust Center.

## Troubleshooting

**MCP server not connected**: Use filesystem fallback. Check that `COMPLIANCE_ROOT` env var is set.

**Incomplete data**: The skill will note which sections could not be populated. Run `get_remediation_roadmap` to see what's missing.

**Agent registry empty**: If no agents are registered yet, omit the agent governance section from the public layer and note "Agent governance framework established, registry population in progress" in the gated summary.

**No audit completed yet**: Use "Compliance program established, audit pending" status. The Trust Center is still valuable pre-audit as it demonstrates program maturity to prospects.
