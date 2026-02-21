# Infrastructure CLI Setup

This framework collects compliance evidence by wrapping CLIs you already have installed. No third-party MCP packages, no service accounts managed by the framework, no credentials stored anywhere — just your existing CLIs with your existing authentication.

**All tools are read-only.** They inspect your infrastructure and return findings. They never modify resources.

**None of these are required.** The compliance agents work without any CLIs installed — they ask you questions instead of pulling data automatically. Install and authenticate CLIs as you go to automate more of the evidence collection.

---

## GitHub CLI (`gh`)

**What it checks:** Branch protection, secret scanning, Dependabot, collaborator access, CI/CD workflows.

**SOC 2 controls:** CC5.1, CC5.2, CC7.1, CC8.1

### Install

```bash
# macOS
brew install gh

# Linux
# See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Windows
winget install GitHub.cli
```

### Authenticate

```bash
gh auth login
```

Follow the browser-based flow. The framework uses `gh auth status` to check if you're authenticated before running any GitHub tools.

### What the tools do

| Tool | What it checks |
|------|---------------|
| `gh_auth_status` | Is the CLI installed and authenticated? |
| `gh_branch_protection` | Review requirements, status checks, admin enforcement on a branch |
| `gh_repo_security` | Secret scanning, push protection, Dependabot security updates |
| `gh_collaborators` | Who has access and at what permission level (flags >3 admins) |
| `gh_workflows` | Active/disabled CI/CD workflows |

### Permissions needed

The authenticated user needs **read access** to the repositories being checked. Branch protection requires admin access or a token with `repo` scope.

---

## AWS CLI (`aws`)

**What it checks:** IAM users and MFA, CloudTrail logging, S3 encryption, KMS key rotation, security groups, backup configuration.

**SOC 2 controls:** CC5.1, CC6.1, CC6.2, CC6.6, CC7.1, CC7.3

### Install

```bash
# macOS
brew install awscli

# Linux / Windows
# See https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
```

### Authenticate

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, default region, output format (json)
```

Or use SSO:

```bash
aws configure sso
aws sso login --profile your-profile
```

The framework uses `aws sts get-caller-identity` to verify authentication.

### What the tools do

| Tool | What it checks |
|------|---------------|
| `aws_auth_status` | Is the CLI installed and authenticated? Returns account ID and ARN. |
| `aws_iam_mfa_status` | MFA enrollment for every IAM user (flags users without MFA) |
| `aws_cloudtrail_status` | Trail configuration: active, multi-region, log file validation |
| `aws_s3_encryption` | Default encryption on each S3 bucket (flags unencrypted buckets) |
| `aws_kms_keys` | Customer-managed KMS keys and automatic rotation status |
| `aws_security_groups` | Flags SSH (port 22) or all-ports open to 0.0.0.0/0 |
| `aws_backup_config` | AWS Backup vaults and plans |

All tools accept an optional `region` parameter. If omitted, your CLI default region is used. IAM tools are global (region is ignored).

### Permissions needed

The IAM user or role needs these read-only policies:

- `iam:ListUsers`, `iam:ListMFADevices`
- `cloudtrail:DescribeTrails`, `cloudtrail:GetTrailStatus`
- `s3:ListAllMyBuckets`, `s3:GetEncryptionConfiguration`
- `kms:ListKeys`, `kms:DescribeKey`, `kms:GetKeyRotationStatus`
- `ec2:DescribeSecurityGroups`
- `backup:ListBackupVaults`, `backup:ListBackupPlans`

Or attach the AWS-managed `ReadOnlyAccess` policy.

---

## Google Cloud CLI (`gcloud`)

**What it checks:** IAM policies, service accounts, logging sinks, KMS keys, firewall rules.

**SOC 2 controls:** CC5.1, CC6.1, CC6.6, CC7.1

### Install

```bash
# macOS
brew install --cask google-cloud-sdk

# Linux / Windows
# See https://cloud.google.com/sdk/docs/install
```

### Authenticate

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

The framework uses `gcloud auth list --format=json` to verify authentication.

### What the tools do

| Tool | What it checks |
|------|---------------|
| `gcloud_auth_status` | Is the CLI installed and authenticated? Returns active account. |
| `gcloud_iam_policy` | Project IAM bindings (flags >3 members with Owner/Editor roles) |
| `gcloud_service_accounts` | Active/disabled service accounts (flags default SAs still active) |
| `gcloud_logging_sinks` | Custom logging sinks for log export |
| `gcloud_kms_keys` | Keyrings and keys with rotation configuration |
| `gcloud_firewall_rules` | Flags SSH or all-traffic open to 0.0.0.0/0 |

All tools require a `project` parameter (your GCP project ID).

### Permissions needed

The authenticated account needs:

- `resourcemanager.projects.getIamPolicy`
- `iam.serviceAccounts.list`
- `logging.sinks.list`
- `cloudkms.keyRings.list`, `cloudkms.cryptoKeys.list`
- `compute.firewalls.list`

Or assign the `Viewer` role at the project level.

---

## Google Workspace via GAM (`gam`)

**What it checks:** User directory, 2-step verification enrollment, admin role assignments, login audit logs.

**SOC 2 controls:** CC5.1, CC6.2, CC7.1

### Install

GAM (Google Apps Manager) is an open-source tool for managing Google Workspace. There are two versions — either works:

```bash
# GAMADV-XTD3 (recommended, more features)
bash <(curl -s -S -L https://raw.githubusercontent.com/taers232c/GAMADV-XTD3/master/src/gam-install.sh)

# Original GAM
bash <(curl -s -S -L https://gam-shortn.appspot.com/gam-install)
```

See [github.com/GAM-team/GAM](https://github.com/GAM-team/GAM) for details.

### Authenticate

GAM requires a service account with domain-wide delegation. During first run, GAM walks you through the setup:

```bash
gam version    # Verify installation
gam info domain # Verify domain access
```

The OAuth scopes GAM needs are configured during setup. The framework uses `gam version` to check if GAM is installed and configured.

### What the tools do

| Tool | What it checks |
|------|---------------|
| `gam_auth_status` | Is GAM installed and authenticated? |
| `gam_users` | All Workspace users: active, suspended, admin count |
| `gam_mfa_status` | 2-step verification: enrolled vs. not enrolled, enforced vs. not enforced |
| `gam_admin_roles` | Admin role assignments (flags >2 super admins) |
| `gam_login_audit` | Recent login events from the Workspace audit log |

### Permissions needed

The GAM service account needs these Admin SDK scopes (configured during GAM setup):

- `https://www.googleapis.com/auth/admin.directory.user.readonly`
- `https://www.googleapis.com/auth/admin.reports.audit.readonly`
- `https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly`

---

## Cloudflare (`curl` + API token)

**What it checks:** SSL/TLS configuration, WAF status, HTTPS enforcement, security level, zone inventory.

**SOC 2 controls:** CC6.1, CC6.6

Cloudflare doesn't need a dedicated CLI. The framework uses `curl` (which is already on your machine) with a Cloudflare API token.

### Create an API token

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Read all resources** template (or create a custom token with `Zone:Read` and `Zone Settings:Read`)
4. Copy the token

### Configure

Set the token as an environment variable before starting Claude Code:

```bash
export CF_API_TOKEN="your-token-here"
```

Or add it to your shell profile (`~/.zshrc`, `~/.bashrc`):

```bash
echo 'export CF_API_TOKEN="your-token-here"' >> ~/.zshrc
```

The framework uses the `/user/tokens/verify` endpoint to check authentication.

### What the tools do

| Tool | What it checks |
|------|---------------|
| `cf_auth_status` | Is the API token valid? |
| `cf_zones` | Active zones (domains) and their plan level |
| `cf_ssl_tls` | SSL mode (off/flexible/full/strict) and minimum TLS version per zone |
| `cf_waf_rules` | WAF managed rules enabled or disabled per zone |
| `cf_security_settings` | Always Use HTTPS, security level, browser integrity check |

Zone-specific tools (`cf_ssl_tls`, `cf_waf_rules`, `cf_security_settings`) require a `zone_id`. Get zone IDs from `cf_zones`.

### Permissions needed

The API token needs:

- **Zone: Read** — list zones
- **Zone Settings: Read** — read SSL, WAF, security settings

The **Read all resources** template covers this.

---

## Terraform (`terraform`)

**What it checks:** Infrastructure-as-Code resource inventory, workspace separation, provider coverage.

**SOC 2 controls:** CC8.1

### Install

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux / Windows
# See https://developer.hashicorp.com/terraform/install
```

### Authenticate

Terraform itself doesn't need separate auth — it uses the credentials of the cloud provider CLIs above. Just make sure Terraform is initialized in your project:

```bash
cd /path/to/your/terraform
terraform init
```

The framework uses `terraform version -json` to check if Terraform is installed.

### What the tools do

| Tool | What it checks |
|------|---------------|
| `tf_version` | Is Terraform installed? Returns version and platform. |
| `tf_state_resources` | All resources in state, categorized by type (proves IaC management) |
| `tf_workspace` | Current workspace and all workspaces (proves environment separation) |
| `tf_providers` | Which providers are in use (shows IaC coverage of infrastructure) |

All tools accept an optional `working_dir` parameter pointing to your Terraform project directory. If omitted, the current directory is used.

### Permissions needed

No additional permissions beyond what Terraform already has. The tools only read state and configuration — they don't plan or apply.

---

## How the tools work together

When you run `/compliance-evidence`, the agent:

1. Checks which CLIs are available (runs each `*_auth_status` tool)
2. Runs the available tools and collects structured findings
3. Stores each result as evidence mapped to specific SOC 2 controls
4. For controls not covered by automation, prompts you for manual attestations

The more CLIs you install, the more evidence is collected automatically. The agent adapts — it never fails because a CLI is missing.

### Typical coverage

| You install | Controls automated |
|------------|-------------------|
| Nothing | None (all manual attestations) |
| `gh` | CC5.1, CC5.2, CC7.1, CC8.1 |
| `gh` + `aws` | + CC6.1, CC6.2, CC6.6, CC7.3 |
| `gh` + `aws` + `gcloud` | Overlapping cloud coverage |
| + `gam` | + CC6.2 (Workspace MFA), CC7.1 (login audit) |
| + `CF_API_TOKEN` | + CC6.1 (TLS), CC6.6 (WAF) |
| + `terraform` | + CC8.1 (IaC proof) |

### Priority order

If you're setting up from scratch, install in this order for maximum compliance coverage with minimum effort:

1. **GitHub CLI** — most companies already use GitHub; covers change management
2. **AWS or GCloud CLI** — whichever cloud you use; covers encryption, access, monitoring
3. **Google Workspace (GAM)** — if you use Google Workspace; covers identity and MFA
4. **Cloudflare** — if you use Cloudflare; covers network security
5. **Terraform** — if you use IaC; provides strong CC8.1 evidence
