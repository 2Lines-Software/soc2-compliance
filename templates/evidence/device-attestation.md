---
id: "EV-DEVICE-{{date}}"
title: "Endpoint Device Security Attestation"
status: draft
tsc_criteria: [CC5.1, CC6.1, CC6.8]
collected_date: null
---

# Endpoint Device Security Attestation

**Attested by**: {{owner_name}}
**Attestation Date**: {{attestation_date}}

## Device Inventory

| Device | Model | OS | OS Version | Serial Number |
|--------|-------|----|------------|--------------|
| {{device_name}} | {{model}} | {{os}} | {{os_version}} | {{serial}} |

## Security Configuration Checklist

### Encryption
- [ ] Full-disk encryption enabled (FileVault / BitLocker)
- [ ] Encryption type: {{encryption_type}}
- [ ] Recovery key stored securely

### Access Controls
- [ ] Screen lock enabled (timeout: {{timeout}} minutes)
- [ ] Login password / biometric required
- [ ] Guest account disabled
- [ ] Auto-login disabled

### Firewall
- [ ] Firewall enabled
- [ ] Stealth mode enabled (if applicable)
- [ ] No unnecessary inbound rules

### Updates
- [ ] Automatic OS updates enabled
- [ ] Current OS version is latest available
- [ ] Application updates enabled

### Endpoint Protection
- [ ] Antivirus/endpoint protection installed: {{av_product}}
- [ ] Real-time protection active
- [ ] Definitions up to date

### Network
- [ ] VPN client installed for remote work: {{vpn_client}}
- [ ] Wi-Fi auto-join for unknown networks disabled

## Attestation

I confirm that the device(s) listed above meet all security configuration requirements as of the attestation date.

**Name**: {{owner_name}}
**Date**: {{attestation_date}}
