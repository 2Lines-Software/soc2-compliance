# Sanitization Reference

Rules for stripping sensitive information when projecting compliance data into Trust Center outputs. These rules apply differently to the public and gated layers.

## Classification of Compliance Data

| Data Type | Example | Public Layer | Gated Layer |
|-----------|---------|-------------|-------------|
| **Commitments** | "We encrypt data at rest" | ✅ Include | ✅ Include |
| **Standards** | "AES-256", "TLS 1.2" | ✅ Include | ✅ Include |
| **Policy IDs** | "POL-001" | ❌ Omit | ✅ Include |
| **Control IDs** | "CC5.1", "AGT-07" | ❌ Omit | ✅ Include |
| **Coverage %** | "92% of controls met" | ❌ Omit | ✅ Include |
| **Audit findings** | "CC5.1 partially met due to..." | ❌ Omit | ⚠️ Summary only |
| **Gap details** | Specific unmet control descriptions | ❌ Omit | ❌ Omit |
| **Remediation items** | "Need to implement log aggregation by Q2" | ❌ Omit | ⚠️ Timeline only |
| **Cloud provider** | "GCP", "AWS" | ❌ Omit | ✅ Include |
| **Cloud project/account** | "proj-12345", "acct-67890" | ❌ Omit | ❌ Omit |
| **Service names** | "Cloud Run", "S3" | ❌ Omit | ✅ Include |
| **Resource identifiers** | Bucket names, VPC IDs, instance IDs | ❌ Omit | ❌ Omit |
| **IP addresses** | Internal or external IPs | ❌ Omit | ❌ Omit |
| **Agent names** | "Gap Assessment Agent" | ❌ Omit | ✅ Include |
| **Agent IDs** | "AGENT-001" | ❌ Omit | ✅ Include |
| **MCP server names** | "cloud-provider-mcp" | ❌ Omit | ❌ Omit |
| **Credential IDs** | "cred-gcp-viewer" | ❌ Omit | ❌ Omit |
| **Secret names** | Names in secrets manager | ❌ Omit | ❌ Omit |
| **Rotation schedules** | "Every 90 days" | ❌ Omit (use "regularly") | ✅ Include |
| **Personnel names** | "John" | ❌ Omit (use role) | ⚠️ Role + name for contacts |
| **Evidence paths** | "/evidence/automated/cloud-iam/" | ❌ Omit | ❌ Omit |
| **Evidence content** | JSON exports, screenshots | ❌ Omit | ❌ Omit |
| **Vendor names** | "Plaid", "GitHub" | ✅ Subprocessor list | ✅ Include |
| **Vendor risk scores** | Internal risk assessment results | ❌ Omit | ❌ Omit |

## Rewriting Rules

### Technical → Commitment (Public Layer)

| Raw Compliance Data | Public Layer Wording |
|---------------------|---------------------|
| "S3 buckets configured with SSE-KMS" | "Data at rest is encrypted using AES-256" |
| "CloudArmor WAF with OWASP rule set" | "Web applications are protected by a managed web application firewall" |
| "GKE private cluster with authorized networks" | "Container workloads run in private, network-isolated environments" |
| "GitHub branch protection: require 1 review + CI pass" | "All code changes require independent review and automated security checks before deployment" |
| "AGENT-001 has cred-gcp-viewer with 90-day rotation" | "Agent credentials are managed in a secrets management service with automated rotation" |
| "Quarterly access review checklist signed by John" | "Access rights are reviewed quarterly" |
| "CI gates serve as compensating control for separation of duties" | "We use automated verification controls to ensure independent validation of changes" |

### Gap → Roadmap (Gated Layer)

| Raw Gap Data | Gated Layer Wording |
|-------------|---------------------|
| "CC7.1: No centralized log aggregation. Logs exist per-service but no SIEM." | "Monitoring: Centralized log aggregation planned for Q2 2026" |
| "CC5.1: Access review evidence incomplete for Q4" | "Access Reviews: Formalizing quarterly review documentation" |
| "AGT-17: Blue team testing not yet conducted for AGENT-003" | "Agent Testing: Blue team testing scheduled for newly deployed agents" |

## Never Share (Either Layer)

These categories are never included in any Trust Center output:

1. **Credentials and secrets** — values, ARNs, connection strings
2. **Internal infrastructure topology** — network diagrams with IPs, resource names
3. **Specific vulnerability findings** — CVEs, scan results, unpatched systems
4. **Penetration test raw results** — only sanitized executive summary
5. **Incident details** — specific past incidents (unless required by breach notification)
6. **Personnel PII** — personal email, phone, address
7. **Client data** — any data belonging to clients encountered during evidence collection
8. **Audit working papers** — auditor notes, draft findings
9. **Legal opinions** — attorney-client privileged communications
10. **Insurance policy details** — coverage limits, deductibles, carrier
