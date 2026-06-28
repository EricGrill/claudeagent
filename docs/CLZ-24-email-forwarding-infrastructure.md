# CLZ-24: Email Forwarding Infrastructure

> **Status**: DEFERRED for MVP (as of 2026-06-24)  
> **Epic**: Data Ingestion  
> **Backlog ID**: CLZ-24

## Executive Summary

This document outlines the technical design for the email forwarding infrastructure that will enable project teams to forward emails directly to ClaimZero for analysis. This feature is deferred until after the MVP report proves valuable, as the MVP will instead use bulk historical exports (see CLZ-25) for more complete coverage.

## Why Deferred?

Email forwarding was deferred for the following reasons:

1. **Distribution infrastructure, not validation**: Live forwarding doesn't test the core hypothesis about risk detection value
2. **Partial/biased coverage**: Forwarding relies on users remembering to include ClaimZero, leading to incomplete data
3. **MVP focus**: Bulk historical exports provide more complete datasets to validate the AI risk engine

## Approach Selection

### Recommended: Subdomain-Based Forwarding with SendGrid/Postmark Inbound Parse

**Pattern**: `{project-identifier}@inbound.claimzero.ai`

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **SendGrid Inbound Parse** | Well-documented, reliable, webhook-based | Cost at scale, vendor dependency | ✅ Primary recommendation |
| **Postmark Inbound** | Clean API, excellent spam filtering | Less flexible routing | ✅ Good alternative |
| **AWS SES Receiving** | Cost-effective, AWS ecosystem | Complex setup, requires S3/Lambda | Consider for AWS-heavy stack |
| **Self-hosted (Postal/Haraka)** | Full control, no vendor lock-in | Operational burden, deliverability management | Not recommended for MVP |
| **Cloudflare Email Workers** | Edge processing, low latency | Newer, less mature | Monitor for future consideration |

### Rationale for SendGrid/Postmark

- **Webhook-based architecture** aligns with ClaimZero's event-driven design
- **Built-in spam filtering** reduces operational burden
- **Attachment handling** includes parsed content and original file access
- **Rate limiting and queuing** included at infrastructure level

## Inbound Email Routing Design

### Address Schema

```
{project-slug}@inbound.claimzero.ai
```

**Examples**:
- `bridge-project-123@inbound.claimzero.ai`
- `data-center-renovation@inbound.claimzero.ai`
- `highway-expansion-2024@inbound.claimzero.ai`

### Routing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Flow Architecture                       │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   Incoming Email    │
                    │ (SMTP to MX record) │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  SendGrid/Postmark  │
                    │   Inbound Parse     │
                    │                     │
                    │ • Spam filtering    │
                    │ • Virus scanning    │
                    │ • Parse attachments │
                    └──────────┬──────────┘
                               │
                               ▼ (Webhook POST)
                    ┌─────────────────────┐
                    │   API Gateway /     │
                    │   Webhook Endpoint  │
                    │                     │
                    │ /api/inbound/email  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Email Processor   │
                    │                     │
                    │ • Extract project   │
                    │   slug from 'to'    │
                    │ • Validate project  │
                    │ • Queue for import  │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐
          │  Message Queue  │    │  Blob Storage   │
          │   (processing)  │    │  (attachments)  │
          └────────┬────────┘    └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  AI Risk Engine │
          │  (CLZ-45+)      │
          └─────────────────┘
```

### Project Identification Logic

```typescript
interface InboundEmailPayload {
  to: string;           // e.g., "bridge-project-123@inbound.claimzero.ai"
  from: string;
  subject: string;
  text: string;
  html: string;
  attachments: Attachment[];
  headers: Record<string, string>;
  spamScore: number;
  timestamp: string;
}

function extractProjectSlug(toAddress: string): string | null {
  const match = toAddress.match(/^([a-z0-9-]+)@inbound\.claimzero\.ai$/i);
  return match ? match[1].toLowerCase() : null;
}

async function routeEmail(payload: InboundEmailPayload): Promise<void> {
  const projectSlug = extractProjectSlug(payload.to);
  
  if (!projectSlug) {
    await logUnroutableEmail(payload);
    return;
  }
  
  const project = await findProjectBySlug(projectSlug);
  
  if (!project) {
    await notifyUnknownProject(projectSlug, payload);
    return;
  }
  
  if (!isAuthorizedSender(payload.from, project)) {
    await logUnauthorizedAttempt(payload, project);
    return;
  }
  
  await queueEmailForProcessing(payload, project);
}
```

## Security and Spam Handling

### Threat Model

| Threat | Mitigation | Priority |
|--------|------------|----------|
| **Spam flooding** | Provider-level spam filtering + rate limiting per project | High |
| **Email spoofing** | Sender whitelist per project, SPF/DKIM validation | High |
| **Malware in attachments** | Virus scanning at provider level + secondary scan | High |
| **Data exfiltration via email** | No auto-reply with sensitive data, audit logging | Medium |
| **Address enumeration** | Generic "not found" responses, rate limiting | Medium |
| **Denial of service** | Provider-level DDoS protection, queue throttling | Medium |

### Spam Filtering Strategy

```yaml
# Tiered spam handling
spam_handling:
  # Provider filters (SendGrid/Postmark)
  provider_level:
    - spam_score_threshold: 5.0
    - known_spam_lists: enabled
    - virus_scanning: enabled
  
  # Application level
  application_level:
    - sender_whitelist_enforcement: optional_per_project
    - rate_limit_per_project: 100/hour
    - rate_limit_per_sender: 20/hour
    - attachment_size_limit_mb: 25
    - total_email_size_limit_mb: 35
  
  # Quarantine handling
  quarantine:
    - hold_suspicious_emails: true
    - retention_days: 30
    - admin_review_queue: enabled
```

### Sender Authorization Model

Projects can configure sender authorization at three levels:

1. **Open** (default for new projects): Accept from any sender
2. **Domain-restricted**: Only accept from specific domains (e.g., `@contractor.com`, `@clientcorp.com`)
3. **Whitelist-only**: Only accept from explicitly authorized email addresses

```typescript
interface ProjectEmailSettings {
  projectId: string;
  authorizationMode: 'open' | 'domain_restricted' | 'whitelist_only';
  authorizedDomains?: string[];
  authorizedEmails?: string[];
  spamScoreThreshold: number;  // Override default, 0-10
  autoProcessEnabled: boolean; // Queue for manual review if false
}
```

### Data Privacy Considerations

1. **Email content storage**: Store in encrypted blob storage with project-scoped access
2. **Metadata retention**: Separate from content, subject to different retention policies
3. **PII detection**: Flag and optionally redact PII before AI processing
4. **Audit trail**: Log all access to email content with user identity
5. **GDPR compliance**: Implement data subject access and deletion workflows

## Operational Ownership

### Team Responsibilities

| Responsibility | Owner | Backup |
|----------------|-------|--------|
| DNS/MX record management | Platform/DevOps | Engineering Lead |
| SendGrid/Postmark account | Platform/DevOps | CTO |
| Webhook endpoint monitoring | Backend Team | Platform/DevOps |
| Spam filter tuning | Backend Team | Data Team |
| Security incident response | Security Lead | CTO |
| User support (routing issues) | Customer Success | Backend Team |

### Monitoring and Alerting

```yaml
# Key metrics to monitor
metrics:
  - name: inbound_emails_received_total
    type: counter
    labels: [project_id, status]
    
  - name: inbound_email_processing_duration_seconds
    type: histogram
    labels: [project_id]
    
  - name: inbound_email_spam_detected_total
    type: counter
    labels: [project_id, spam_type]
    
  - name: inbound_email_queue_depth
    type: gauge
    labels: [priority]

# Alert thresholds
alerts:
  - name: HighSpamRate
    condition: spam_rate > 30% over 1h
    severity: warning
    
  - name: ProcessingBacklog
    condition: queue_depth > 1000
    severity: critical
    
  - name: WebhookFailures
    condition: webhook_error_rate > 1% over 15m
    severity: critical
    
  - name: UnroutableEmailSpike
    condition: unroutable_emails > 50 over 1h
    severity: warning
```

### Runbooks

1. **High spam rate**: Adjust spam score threshold, review sender patterns, consider domain blocking
2. **Processing backlog**: Scale queue consumers, check for stuck jobs, verify downstream services
3. **Webhook failures**: Check endpoint health, review error logs, verify authentication tokens
4. **Unroutable email spike**: Check for typo patterns, verify project slugs, notify affected users

## Implementation Roadmap

### Phase 1: Infrastructure Setup
- [ ] Set up SendGrid/Postmark account with inbound parsing enabled
- [ ] Configure DNS (MX records for `inbound.claimzero.ai`)
- [ ] Implement webhook endpoint with signature validation
- [ ] Set up blob storage for attachments
- [ ] Implement message queue for async processing

### Phase 2: Core Processing
- [ ] Build email parser (extract project slug, validate, route)
- [ ] Implement project lookup and authorization checks
- [ ] Create attachment handling pipeline (storage, virus scan, metadata extraction)
- [ ] Connect to existing document ingestion pipeline (CLZ-25/CLZ-26)

### Phase 3: Admin and Configuration
- [ ] Build admin UI for project email settings
- [ ] Implement sender whitelist management
- [ ] Create quarantine review interface
- [ ] Add email forwarding setup wizard for project owners

### Phase 4: Monitoring and Hardening
- [ ] Deploy monitoring dashboards
- [ ] Set up alerting
- [ ] Load test with realistic volumes
- [ ] Security review and penetration testing
- [ ] Document runbooks and on-call procedures

## Cost Estimation

| Component | Provider | Estimated Monthly Cost (10k emails/mo) |
|-----------|----------|----------------------------------------|
| Inbound email processing | SendGrid | $15-30 |
| Attachment storage | Cloud blob storage | $5-10 |
| Queue processing | Cloud functions/workers | $10-20 |
| DNS/Domain | Existing | $0 |
| **Total** | | **$30-60** |

*Note: Costs scale roughly linearly. At 100k emails/month, expect $200-400.*

## Appendix: Alternative Approaches Considered

### A. Generic Catch-All Address

**Pattern**: `inbound@claimzero.ai` with project ID in subject line

- **Pro**: Single address to manage
- **Con**: Requires user training, higher error rate, harder to automate
- **Decision**: Rejected

### B. Per-Project Subdomain

**Pattern**: `mail@{project-slug}.claimzero.ai`

- **Pro**: Clean separation, flexible future routing
- **Con**: DNS complexity, SSL certificate management
- **Decision**: Deferred - consider if subdomain isolation becomes valuable

### C. Reply-to-Thread Tracking

**Pattern**: Reply to system-generated emails with thread ID in headers

- **Pro**: Excellent UX for ongoing conversations
- **Con**: Requires outbound email first, doesn't work for new threads
- **Decision**: Consider as enhancement after basic forwarding works

---

*Document created: 2026-06-28*  
*Last updated: 2026-06-28*  
*Status: Ready for post-MVP implementation*
