---
id: "AGENT-XXX"
type: "agent-registry"
status: "active"
name: "{{agent_name}}"
purpose: "{{agent_purpose}}"
owner: "{{owner_name}}"
risk_tier: 0
context_classification: "trusted"
control_tier: "tier-1"
created: "{{created_date}}"
last_reviewed: "{{created_date}}"
next_review: "{{next_review_date}}"
blue_team_status: "n/a"
tsc_controls: []
---

# {{agent_name}}

## Context Sources

- {{source}}: {{description}} (trusted/untrusted)

## Untrusted Input Path

None — all context sourced from systems under org control.

## Data Access

| Data Category | Scope | Classification | Access Type |
|---------------|-------|----------------|-------------|
| {{category}} | {{scope}} | {{classification}} | Read/Write/Delete |

### Explicitly Excluded

- {{excluded_data}}

## Tool Access

| MCP / Tool | Permissions | Credential Type | Credential ID |
|------------|-------------|-----------------|---------------|
| {{tool}} | {{permissions}} | {{cred_type}} | {{cred_id}} |

### Explicitly Excluded

- {{excluded_tools}}

## Action Permissions

| Action | Permitted | Notes |
|--------|-----------|-------|
| {{action}} | ✅ / ❌ | {{notes}} |

## Boundary Constraints

- {{constraint}}

## Credentials

| Credential ID | Type | Created | Last Rotated | Rotation Target | Stored In |
|---------------|------|---------|-------------|-----------------|-----------|
| {{cred_id}} | {{type}} | {{created}} | {{rotated}} | 90 days | {{stored_in}} |
