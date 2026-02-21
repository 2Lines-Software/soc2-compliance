# Data Processing Addendum

_Between {{company_name}} ("Processor") and _________________ ("Controller")_

_Effective Date: _______________

---

> **CONFIDENTIAL** — This document is provided under non-disclosure agreement.
> Unauthorized distribution is prohibited.

## 1. Definitions

**Personal Data**: Any information relating to an identified or identifiable natural person processed by the Processor on behalf of the Controller under the terms of the underlying service agreement.

**Processing**: Any operation performed on Personal Data, including collection, storage, retrieval, use, transmission, erasure, or destruction.

**Subprocessor**: Any third party engaged by the Processor to process Personal Data on behalf of the Controller.

## 2. Scope of Processing

### 2.1 Categories of Data Subjects

{{data_subject_categories}}

### 2.2 Categories of Personal Data

{{personal_data_categories}}

### 2.3 Processing Purposes

{{processing_purposes}}

### 2.4 Duration of Processing

{{processing_duration}}

## 3. Processor Obligations

### 3.1 Security Measures

The Processor implements and maintains the following technical and organizational measures:

**Access Control**
- Multi-factor authentication for all system access
- Role-based access with least-privilege enforcement
- Quarterly access reviews
- Immediate access revocation upon personnel changes

**Encryption**
- Data in transit: TLS 1.2+
- Data at rest: AES-256 or equivalent
- Key management via dedicated secrets management service

**Monitoring**
- Comprehensive audit logging with {{log_retention_period}} retention
- Automated anomaly detection and alerting
- Regular log reviews

**AI Agent Governance** (if applicable)
- All AI agents registered with documented data access scope
- Context trust classification applied to all agent operations
- Adversarial controls for agents processing Controller data
- Quarterly blue team testing for agents with untrusted context

### 3.2 Confidentiality

The Processor ensures that persons authorized to process Personal Data have committed to confidentiality obligations.

### 3.3 Subprocessors

Current subprocessors:

{{subprocessor_table}}

The Processor will notify the Controller {{subprocessor_notification_period}} prior to engaging a new subprocessor. The Controller may object to a new subprocessor within {{subprocessor_objection_period}} of notification.

### 3.4 Data Subject Rights

The Processor will assist the Controller in responding to data subject requests for access, rectification, erasure, portability, and restriction of processing within {{dsr_response_sla}}.

### 3.5 Breach Notification

The Processor will notify the Controller of any confirmed Personal Data breach within {{breach_notification_sla}} of becoming aware of the breach. Notification will include:
- Nature of the breach
- Categories and approximate number of data subjects affected
- Likely consequences
- Measures taken or proposed to mitigate

### 3.6 Data Retention and Deletion

Upon termination of the service agreement or upon Controller request, the Processor will:
- Delete all Personal Data within {{deletion_sla}}
- Provide written certification of deletion
- Ensure subprocessors delete Personal Data within the same timeframe

## 4. Controller Obligations

The Controller will:
- Ensure lawful basis for processing
- Provide clear processing instructions
- Notify the Processor of any data subject requests
- Maintain appropriate agreements with its own data subjects

## 5. International Transfers

{{#if international_transfers}}
{{international_transfer_details}}
{{else}}
Personal Data is processed and stored within {{data_residency_region}}. No international transfers occur under standard processing operations.
{{/if}}

## 6. Audit Rights

The Controller may audit the Processor's compliance with this Addendum by:
- Reviewing the Processor's most recent SOC 2 report
- Submitting a security questionnaire (annually)
- Conducting or commissioning an on-site audit with {{audit_notice_period}} written notice, during business hours, at Controller's expense

## 7. Term and Termination

This Addendum is effective for the duration of the underlying service agreement. Sections relating to confidentiality, data deletion, and audit rights survive termination.

---

**Processor**

Name: {{company_name}}
Authorized Signatory: _______________
Date: _______________

**Controller**

Name: _______________
Authorized Signatory: _______________
Date: _______________
