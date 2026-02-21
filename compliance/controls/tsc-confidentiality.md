---
id: TSC-CONF
title: "TSC: Confidentiality"
status: approved
version: "1.0"
tsc_criteria: [C1]
---

# TSC: Confidentiality (C1)

The Confidentiality criteria address how the organization protects confidential information throughout its lifecycle — from identification through disposal.

---

## C1.1 — Identification of Confidential Information

### C1.1.1 — Classification and Identification
- **What the auditor looks for**: Process for identifying and classifying confidential information.
- **Evidence types**: Data classification policy, data inventory, classification labels
- **Typical controls**:
  - Data classification policy (Critical / Sensitive / Internal / Public)
  - Data inventory identifying confidential information assets
  - Classification labeling or tagging
  - Data flow mapping showing where confidential data resides and moves
- **MCP discovery targets**: Cloud storage classifications, database schemas, data flow documentation
- **Solo-company note**: Maintain a simple data inventory. At minimum, document: what confidential data you handle, where it's stored, how it flows through your systems, and who has access.

### C1.1.2 — Access to Confidential Information
- **What the auditor looks for**: Access to confidential information restricted to authorized individuals based on business need.
- **Evidence types**: Access control lists for sensitive data stores, IAM policies scoped to confidential data
- **Typical controls**:
  - Access restricted based on data classification
  - Principle of least privilege for confidential data
  - Separate access controls for confidential data stores
  - Access logging for confidential data
- **MCP discovery targets**: IAM policies for databases/storage containing confidential data, access logs
- **Solo-company note**: Ensure service accounts accessing confidential data have minimal required permissions. Log all access to confidential data stores.
- **Compensating control**: Automated IAM policy enforcement with narrow scoping replaces committee-based access approval for confidential data.

### C1.1.3 — Protection of Confidential Information
- **What the auditor looks for**: Technical and organizational controls protecting confidential information.
- **Evidence types**: Encryption configuration for confidential data stores, DLP configuration, network segmentation
- **Typical controls**:
  - Encryption at rest for all confidential data
  - Encryption in transit for all confidential data transfers
  - Network segmentation isolating confidential data
  - Data loss prevention (DLP) controls
  - Secure API design for confidential data access
- **MCP discovery targets**: Storage encryption, TLS configuration, network segmentation for data stores
- **Solo-company note**: Rely on cloud-managed encryption. Ensure confidential data stores are in private subnets. API endpoints handling confidential data should use authentication and rate limiting.

### C1.1.4 — Confidential Information in System Interfaces
- **What the auditor looks for**: Controls over confidential information shared with or received from third parties.
- **Evidence types**: API documentation, data sharing agreements, integration security reviews
- **Typical controls**:
  - Secure API design (authentication, authorization, encryption)
  - Data sharing agreements with third parties
  - Monitoring of data exchange with external systems
  - Input validation and output sanitization

---

## C1.2 — Disposal of Confidential Information

### C1.2.1 — Data Retention
- **What the auditor looks for**: Defined retention periods for confidential information based on business and regulatory requirements.
- **Evidence types**: Data retention policy, retention schedule
- **Typical controls**:
  - Documented retention periods per data type
  - Automated retention enforcement (TTL, lifecycle policies)
  - Regular review of retention compliance
- **MCP discovery targets**: Cloud storage lifecycle policies, database retention settings
- **Solo-company note**: Define retention periods based on contractual obligations and regulatory requirements. Use cloud lifecycle policies to automate expiration where possible.

### C1.2.2 — Secure Disposal
- **What the auditor looks for**: Confidential information disposed of securely when no longer needed.
- **Evidence types**: Disposal procedures, disposal records, secure deletion evidence
- **Typical controls**:
  - Secure deletion procedures (not just soft-delete)
  - Cryptographic erasure where supported
  - Disposal logging and verification
  - Media sanitization for physical devices
  - Contractor/vendor data return/destruction on engagement end
- **Solo-company note**: Use cloud-native secure deletion features. For local devices, use full-disk encryption (disposal = key destruction). Document disposal procedures in the data classification policy.

---

## Control Summary

| Criteria | Sub-controls | Key Focus |
|----------|-------------|-----------|
| C1.1 | C1.1.1-C1.1.4 | Identification, access, protection, and sharing of confidential information |
| C1.2 | C1.2.1-C1.2.2 | Retention and secure disposal of confidential information |

**Total sub-controls**: 6

## Cross-References to Security Controls

Many Confidentiality controls are satisfied by Security controls already in place:

| Confidentiality Control | Related Security Control | Notes |
|------------------------|------------------------|-------|
| C1.1.2 (Access) | CC5.1 (Logical Access) | Same access control mechanisms apply |
| C1.1.3 (Encryption) | CC6.1 (Encryption) | Encryption controls cover confidential data |
| C1.1.3 (Network) | CC6.6 (Boundaries) | Network segmentation protects confidential data |
| C1.1.4 (Interfaces) | CC6.2, CC6.3 (Auth) | API authentication and authorization |
| C1.2.1 (Retention) | CC7.3 (BCP) | Backup retention aligns with data retention |
