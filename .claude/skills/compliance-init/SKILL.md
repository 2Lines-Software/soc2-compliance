---
name: compliance-init
description: Initialize the SOC 2 compliance framework for a company. Collects company information and populates the configuration scope, evidence manifest, and verifies control mappings are in place. Use when saying "initialize compliance", "compliance-init", "set up SOC 2", or "start compliance framework".
---

# /compliance-init — Initialize SOC 2 Compliance Framework

## Description
Initialize the SOC 2 compliance framework for a company. Collects company information and populates the configuration scope, evidence manifest, and verifies control mappings are in place.

## When to Use
Use when setting up the compliance framework for the first time, or resetting the configuration for a new company.

## Instructions

You are initializing a SOC 2 compliance framework for a small company (<5 people). Follow these steps:

### Step 1: Collect Company Information
Use AskUserQuestion to gather the following information:

**Required:**
- Company name
- Personnel count (1-5)
- Principal/security owner name and email

**Environment:**
- Cloud provider (AWS, GCP, Azure) and account/project ID
- Identity provider (Google Workspace, Okta, etc.)
- Source control platform and org (e.g., GitHub / org-name)
- CI/CD platform (GitHub Actions, etc.)
- Key infrastructure services (list)
- Endpoint devices (model, OS)

**Data:**
- Key SaaS tools and their data sensitivity
- Secrets management provider
- Logging/monitoring provider
- Data classification examples for each level (Critical, Sensitive, Internal, Public)

### Step 2: Populate Scope Configuration
Use the `update_document` MCP tool to update `config/scope.md` with the collected information. Replace all `{{placeholder}}` values with actual data. Set status to "approved" and add today's date for `last_reviewed`.

### Step 3: Verify Control Mappings
Use `list_controls` to verify that TSC Security (CC1-CC9) and Confidentiality (C1) controls are loaded. Report the total count.

### Step 4: Initialize Evidence Manifest
Use `update_manifest` to set up the initial evidence manifest with all controls listed and their evidence status set to "pending".

### Step 5: Output Summary
Display a summary showing:
- Company profile configured
- TSC scope: Security + Confidentiality
- Total controls to address
- Next steps: Run `/compliance-gap` to assess current state

## MCP Tools Used
- `read_document` — Read existing scope config
- `update_document` — Populate scope config
- `list_controls` — Verify control mappings
- `get_control_coverage` — Show initial coverage (should be 0%)
- `update_manifest` — Initialize evidence manifest
- `get_compliance_dashboard` — Show initial state
