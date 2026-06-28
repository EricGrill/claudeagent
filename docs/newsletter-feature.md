# Construction Risk Brief - Weekly Newsletter Feature

## Overview

The Construction Risk Brief is a weekly subscription newsletter that aggregates early-warning signals across the ClaimZero portfolio and turns them into readable market intelligence.

## Features

### Data Sources
- Weekly snapshot risk scores and deltas
- New/worsening/resolved risk counts
- Projects crossing critical/watch thresholds
- Trend categories (schedule, design, cost, dispute)

### Outputs
- Email digest with portfolio risk movement
- "Projects to watch" section
- Top risk themes for the week
- Exportable PDF for distribution

### Target Buyers
- Owners
- Lenders
- Insurers
- General Contractors

## Architecture

### Database Models

The feature uses the following Prisma models:

- **Tenant** - Multi-tenant organization support
- **User** - Newsletter recipients with roles
- **Portfolio** - Collection of construction projects
- **Project** - Individual construction projects
- **RiskScore** - Weekly snapshot of project risk scores
- **RiskSignal** - Individual risk indicators/signals
- **NewsletterConfig** - Per-tenant newsletter configuration
- **NewsletterSubscription** - User subscriptions
- **NewsletterIssue** - Record of sent newsletters

### Services

- `lib/services/risk-aggregation.ts` - Aggregates weekly risk data
- `lib/services/newsletter.ts` - Newsletter generation and sending
- `lib/services/email.ts` - Email delivery via Resend

### Templates

- `lib/templates/newsletter-email.tsx` - HTML email template
- `lib/templates/newsletter-pdf.tsx` - PDF export template using @react-pdf/renderer

## API Endpoints

### Newsletter Generation

```
POST /api/newsletter/generate
```

Generate a new newsletter for a tenant.

**Body:**
```json
{
  "tenantId": "string",
  "weekStart": "ISO datetime (optional)",
  "weekEnd": "ISO datetime (optional)",
  "previewMode": false
}
```

### Newsletter Preview

```
POST /api/newsletter/preview
```

Preview newsletter HTML without creating a record.

**Body:**
```json
{
  "tenantId": "string",
  "weekStart": "ISO datetime (optional)",
  "weekEnd": "ISO datetime (optional)"
}
```

**Returns:** HTML content

### PDF Export

```
POST /api/newsletter/pdf
```

Generate and download a PDF version of the newsletter.

**Body:**
```json
{
  "tenantId": "string",
  "weekStart": "ISO datetime (optional)",
  "weekEnd": "ISO datetime (optional)"
}
```

**Returns:** PDF file download

### Send Newsletter

```
POST /api/newsletter/send
```

Send a generated newsletter to all active subscribers.

**Body:**
```json
{
  "issueId": "string",
  "includePdf": true
}
```

### Subscription Management

```
POST /api/newsletter/subscribe
```

Subscribe a user to the newsletter.

**Body:**
```json
{
  "userId": "string",
  "tenantId": "string"
}
```

```
DELETE /api/newsletter/subscribe
```

Unsubscribe a user from the newsletter.

**Body:**
```json
{
  "userId": "string",
  "tenantId": "string"
}
```

### Configuration

```
GET /api/newsletter/config?tenantId=xxx
```

Get newsletter configuration for a tenant.

```
PUT /api/newsletter/config
```

Update newsletter configuration.

**Body:**
```json
{
  "tenantId": "string",
  "frequency": "WEEKLY | BIWEEKLY | MONTHLY",
  "dayOfWeek": 0-6,
  "hourOfDay": 0-23,
  "isActive": true,
  "includeAnonymized": false
}
```

### History

```
GET /api/newsletter/history?tenantId=xxx&limit=10&offset=0
```

Get newsletter history for a tenant.

### Cron Endpoint

```
GET /api/cron/weekly-newsletter
Authorization: Bearer {CRON_SECRET}
```

Trigger newsletter generation and sending for all active tenants.

## Configuration Options

### Newsletter Frequency
- **WEEKLY** - Sent every week
- **BIWEEKLY** - Sent every two weeks
- **MONTHLY** - Sent on the first week of each month

### Schedule
- `dayOfWeek` - 0 (Sunday) to 6 (Saturday)
- `hourOfDay` - 0 to 23 (UTC)

### Privacy
- `includeAnonymized` - Include cross-tenant anonymized data

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key for email delivery
- `EMAIL_FROM` - Sender email address
- `CRON_SECRET` - Secret for cron endpoint authentication

### 3. Initialize Database

```bash
npm run db:push
```

### 4. Seed Data (Development)

```bash
npm run db:seed
```

### 5. Configure Cron Job

Set up a cron job to hit the `/api/cron/weekly-newsletter` endpoint:

**Vercel Cron (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-newsletter",
      "schedule": "0 * * * 1"
    }
  ]
}
```

**External Cron (e.g., cron-job.org):**
```
0 8 * * 1 curl -X GET https://your-domain.com/api/cron/weekly-newsletter -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Open Questions

### Per-tenant vs Cross-tenant
The current implementation is per-tenant. The `includeAnonymized` option is stubbed for future cross-tenant anonymized data aggregation.

### Frequency
Configurable per-tenant: weekly, bi-weekly, or monthly.

### Pricing Model
Not implemented in this feature. Consider:
- Per-seat pricing (based on subscribers)
- Per-project pricing (based on portfolio size)
- Flat subscription (unlimited)

## Email Template Sections

1. **Header** - ClaimZero branding, week range, tenant name
2. **Portfolio Overview** - Average risk score, trend, project counts
3. **Risk Counts** - Critical, watch, new signals, resolved
4. **Projects to Watch** - Table of high-risk projects
5. **Threshold Changes** - Escalated and de-escalated projects
6. **Top Risk Themes** - Risk categories with affected projects
7. **New Risk Signals** - List of new signals detected
8. **Resolved Signals** - Signals resolved this week
9. **Footer** - Generation timestamp, unsubscribe link

## PDF Export

The PDF export includes:
- Multi-page document (A4 size)
- All newsletter sections
- Professional formatting for distribution
- Page numbers and generation timestamp
