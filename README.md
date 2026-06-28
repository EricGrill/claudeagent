# ClaimZero MVP

A Next.js application for the ClaimZero risk analysis platform.

## Features

### Admin Settings UI

Global administrators can configure optional services from `/admin/settings`:

- **Object Storage (S3/MinIO)** - S3-compatible storage for file uploads and exports
- **Email (SMTP)** - SMTP server configuration for digest emails
- **AI Analysis (OpenAI)** - OpenAI API configuration for AI-powered risk analysis

### Graceful Degradation

All optional services degrade gracefully when not configured:

| Service | Unconfigured Behavior |
|---------|----------------------|
| Storage | Falls back to local HTML downloads |
| SMTP | Digest emails disabled with clear status badge |
| OpenAI | Runs in deterministic stub mode |

### Environment Variable Fallback

Settings configured in the UI take precedence over environment variables. If a setting is not configured in the UI, the system falls back to the corresponding environment variable. Existing deployments using environment variables continue to work unchanged.

#### Environment Variables

**Storage (S3/MinIO):**
- `S3_ENDPOINT` - S3-compatible endpoint URL
- `S3_REGION` - AWS region (default: us-east-1)
- `S3_ACCESS_KEY_ID` - Access key ID
- `S3_SECRET_ACCESS_KEY` - Secret access key
- `S3_BUCKET` - Bucket name
- `S3_PUBLIC_URL` - Public URL prefix (optional)

**SMTP:**
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP port (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `DIGEST_FROM_ADDRESS` - Sender email address

**OpenAI:**
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - Model name (default: gpt-4)
- `OPENAI_MAX_TOKENS` - Max tokens per request (default: 4096)
- `OPENAI_REQUESTS_PER_MINUTE` - Rate limit (default: 60)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Or push schema directly
npm run db:push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Admin Settings

Navigate to [http://localhost:3000/admin/settings](http://localhost:3000/admin/settings) to configure optional services.

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [React 18](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - S3-compatible storage
- [Nodemailer](https://nodemailer.com/) - Email sending
- [OpenAI](https://openai.com/) - AI analysis

## Project Structure

```
├── app/
│   ├── admin/settings/     # Admin settings UI
│   ├── api/admin/settings/ # Settings API routes
│   └── generated/prisma/   # Generated Prisma client
├── components/
│   ├── admin/              # Admin-specific components
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── db.ts               # Database client
│   ├── settings.ts         # Settings service
│   ├── storage.ts          # S3/MinIO service
│   ├── email.ts            # SMTP service
│   └── openai.ts           # OpenAI service
└── prisma/
    ├── schema.prisma       # Database schema
    └── migrations/         # Database migrations
```

## License

Private - All rights reserved
