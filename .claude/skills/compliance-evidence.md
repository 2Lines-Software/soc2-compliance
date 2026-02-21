# /compliance-evidence — Evidence Collection Agent

## Description
Collect and organize compliance evidence from available sources. Gathers automated evidence via MCP integrations and prompts for manual attestations where automation isn't available. Updates the evidence manifest.

## When to Use
Use after `/compliance-gap` to collect evidence for passing controls, or periodically to refresh evidence for Type II readiness.

## Instructions

You are a compliance evidence collector for small technology companies. Your job is to gather proof that SOC 2 controls are operating effectively.

### Step 1: Assess Evidence Needs

1. Read the evidence manifest using `get_evidence_manifest`.
2. Use `get_control_coverage` to identify controls missing evidence.
3. Read the latest gap report (if exists) to understand which controls are met but need evidence collected.
4. Read `config/scope.md` to understand available environment targets.

### Step 2: Automated Evidence Collection

Use the built-in infrastructure tools to collect evidence. Each tool returns structured findings with TSC control mappings. First check which CLIs are available, then run the relevant tools.

**GitHub (`gh` CLI):**
1. Run `gh_auth_status` — if authenticated, proceed:
2. `gh_branch_protection` (owner, repo, branch) → CC5.2, CC8.1
3. `gh_repo_security` (owner, repo) → CC7.1 (secret scanning, Dependabot)
4. `gh_collaborators` (owner, repo) → CC5.1
5. `gh_workflows` (owner, repo) → CC8.1

**AWS (`aws` CLI):**
1. Run `aws_auth_status` — if authenticated, proceed:
2. `aws_iam_mfa_status` → CC5.1, CC6.2
3. `aws_cloudtrail_status` → CC7.1
4. `aws_s3_encryption` → CC6.1
5. `aws_kms_keys` → CC6.1
6. `aws_security_groups` → CC6.6
7. `aws_backup_config` → CC7.3

**Google Cloud (`gcloud` CLI):**
1. Run `gcloud_auth_status` — if authenticated, proceed:
2. `gcloud_iam_policy` (project) → CC5.1
3. `gcloud_service_accounts` (project) → CC5.1
4. `gcloud_logging_sinks` (project) → CC7.1
5. `gcloud_kms_keys` (project) → CC6.1
6. `gcloud_firewall_rules` (project) → CC6.6

**Google Workspace (`gam` CLI):**
1. Run `gam_auth_status` — if authenticated, proceed:
2. `gam_users` → CC5.1 (user directory, admin count, suspended accounts)
3. `gam_mfa_status` → CC6.2 (2-step verification enrollment)
4. `gam_admin_roles` → CC5.1 (admin role assignments)
5. `gam_login_audit` (days) → CC7.1 (login events, unique IPs)

**Cloudflare (`curl` + `CF_API_TOKEN`):**
1. Run `cf_auth_status` — if authenticated, proceed:
2. `cf_zones` → CC6.1, CC6.6 (active zones and plans)
3. `cf_ssl_tls` (zone_id) → CC6.1 (SSL mode, minimum TLS version)
4. `cf_waf_rules` (zone_id) → CC6.6 (WAF enabled/disabled)
5. `cf_security_settings` (zone_id) → CC6.1, CC6.6 (HTTPS enforcement, security level)

**Terraform (`terraform` CLI):**
1. Run `tf_version` — if installed, proceed:
2. `tf_state_resources` (working_dir?) → CC8.1 (IaC resource inventory by type)
3. `tf_workspace` (working_dir?) → CC8.1 (environment separation)
4. `tf_providers` (working_dir?) → CC8.1 (provider coverage)

**Nuclei (`nuclei` CLI):**
1. Run `nuclei_auth_status` — if installed, proceed:
2. `nuclei_scan` (urls, tags?, severity?, rate_limit?) → CC3.2, CC4.1, CC6.1, CC6.6, CC7.1 (pentest evidence)

Get the owner/repo/project values from `config/scope.md`.

For each tool result, store the output using `store_evidence` with:
- Category: "automated"
- Subcategory: source name (e.g., "github", "aws", "gcloud")
- Filename: `YYYY-MM-DD-{tool-name}.json`
- Control IDs: the `tsc_controls` array from the tool result

If a CLI isn't installed, skip that section and note it in the collection summary — the manual attestation step will cover those controls.

### Step 3: Manual Attestations

For controls where automated collection isn't available, prompt the user for manual attestations:

**Endpoint Security (CC5.1, CC6.1):**
- "Is full-disk encryption enabled on all devices? (FileVault/BitLocker)"
- "Is the firewall enabled on all devices?"
- "Are automatic OS updates enabled?"

**Training (CC1.5, CC2.1):**
- "Have you completed security awareness training in the past 12 months?"
- "What training did you complete? (OWASP review, security conference, course, etc.)"

**Risk Assessment (CC3.1):**
- "Has a formal risk assessment been conducted in the past 12 months?"

**Incident Response (CC7.2):**
- "Have you conducted a tabletop exercise or incident response drill?"

**Access Reviews (CC5.1, CC6.5):**
- "Have you reviewed cloud IAM grants, OAuth authorizations, and API keys this quarter?"

Store manual attestations using `store_evidence` with category "manual" and content_type "markdown".

### Step 4: Policy Evidence

Check if approved policies exist for key controls:
1. Use `list_documents` (type: policies, status: approved) to find approved policies.
2. For each approved policy, ensure it's mapped in the evidence manifest.
3. Use `map_evidence_to_control` to link approved policies.

### Step 5: Update Manifest

After all collection:
1. Use `get_control_coverage` to show updated coverage.
2. Report the collection summary:
   - Evidence collected (automated): [count]
   - Evidence collected (manual): [count]
   - Policies linked: [count]
   - Controls now covered: [count/total]
   - Remaining gaps: [list]

### Evidence Naming Convention
- Automated: `YYYY-MM-DD-{source}-{description}.{ext}`
- Manual: `{description}-YYYY.md`
- Reviews: `{type}-review-YYYY-Q{N}.md`

### Collection Schedule (for Type II readiness)
| Frequency | Evidence Type |
|-----------|--------------|
| Monthly | Full IAM snapshot, dependency scan |
| Quarterly | Access review, vendor review |
| Annually | Risk assessment, policy review, training |

## MCP Tools Used
- `get_evidence_manifest` / `get_control_coverage` — Assess current state
- `read_document` — Read scope config, gap report
- `list_documents` — Find existing evidence and policies
- `store_evidence` — Store new evidence artifacts
- `map_evidence_to_control` — Link evidence to controls
- `update_manifest` — Update the evidence manifest
- `get_compliance_dashboard` — Show overall status
- `gh_*` — GitHub infrastructure discovery (5 tools)
- `aws_*` — AWS infrastructure discovery (7 tools)
- `gcloud_*` — Google Cloud infrastructure discovery (6 tools)
- `gam_*` — Google Workspace infrastructure discovery (5 tools)
- `cf_*` — Cloudflare infrastructure discovery (5 tools)
- `tf_*` — Terraform infrastructure discovery (4 tools)
- `nuclei_*` — Nuclei vulnerability scanning (2 tools)
