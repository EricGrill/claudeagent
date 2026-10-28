# ClaimZero

A Next.js application for construction claims management with deep integrations to construction industry platforms.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### Project Management

- View and manage construction projects
- Track project status, risk levels, and progress
- Monitor budgets and claims

### Claims Tracking

- Submit and review claims
- Track claim status through approval workflow
- Link claims to external issue tracking systems

### Integrations

ClaimZero connects with leading construction management platforms to streamline your workflow.

## Autodesk Construction Cloud Integration

ClaimZero provides deep integration with Autodesk Construction Cloud (ACC), allowing you to:

- **Sync Projects**: Connect your ACC projects with ClaimZero projects
- **Import Issues**: Convert ACC issues directly into ClaimZero claims
- **Access Documents**: Browse and reference project documents from ACC
- **Real-time Updates**: Receive webhook notifications when data changes

### Setup

1. **Create an Autodesk Platform Services Application**

   Visit [Autodesk Platform Services](https://aps.autodesk.com/) and create a new application. Note your Client ID and Client Secret.

2. **Configure Environment Variables**

   Add the following environment variables to your `.env.local` file:

   ```env
   AUTODESK_CLIENT_ID=your_client_id
   AUTODESK_CLIENT_SECRET=your_client_secret
   AUTODESK_CALLBACK_URL=http://localhost:3000/api/autodesk/auth/callback
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Configure OAuth Callback**

   In the Autodesk Platform Services portal, add `http://localhost:3000/api/autodesk/auth/callback` as an allowed callback URL.

4. **Connect Your Account**

   Navigate to `/integrations/autodesk` in the application and click "Connect to Autodesk" to authorize the integration.

### API Endpoints

#### Authentication

- `GET /api/autodesk/auth` - Get OAuth authorization URL
- `GET /api/autodesk/auth/callback` - OAuth callback handler
- `POST /api/autodesk/auth/refresh` - Refresh access token
- `GET /api/autodesk/auth/status` - Check authentication status
- `DELETE /api/autodesk/auth` - Revoke token and disconnect

#### Hubs & Projects

- `GET /api/autodesk/hubs` - List all accessible hubs (accounts)
- `GET /api/autodesk/projects?hubId=<id>` - List projects in a hub
- `GET /api/autodesk/projects/[projectId]` - Get project details

#### Issues

- `GET /api/autodesk/issues?projectId=<id>` - List issues in a project
- `POST /api/autodesk/issues` - Create a new issue
- `GET /api/autodesk/issues/[issueId]?projectId=<id>` - Get issue details
- `PATCH /api/autodesk/issues/[issueId]` - Update an issue
- `GET /api/autodesk/issues/types?projectId=<id>` - Get issue types

### Data Types

The integration uses comprehensive TypeScript types for all Autodesk data structures. See `lib/autodesk/types.ts` for:

- `AutodeskProject` - Project data from ACC
- `AutodeskIssue` - Issue/RFI data
- `AutodeskUser` - User information
- `AutodeskFolder` / `AutodeskItem` - Document structure
- And more...

### Components

Pre-built React components for the integration:

```tsx
import {
  AutodeskConnectButton,
  AutodeskConnectionStatus,
  AutodeskProjectSelector,
  AutodeskIssuesList,
} from "@/components/autodesk";

// Connect button
<AutodeskConnectButton
  onConnectStart={() => console.log("Connecting...")}
  onError={(error) => console.error(error)}
/>

// Connection status indicator
<AutodeskConnectionStatus
  onDisconnect={() => console.log("Disconnected")}
/>

// Project selector
<AutodeskProjectSelector
  onProjectSelect={(project, hub) => console.log(project)}
  selectedProjectId={currentProjectId}
/>

// Issues list with import capability
<AutodeskIssuesList
  projectId={projectId}
  onImportIssue={(issue) => importAsClai(issue)}
/>
```

### Scopes Required

The integration requests the following OAuth scopes:

- `data:read` - Read project data and documents
- `data:write` - Create and update data
- `account:read` - Access account information
- `user-profile:read` - Read user profile data

## Error Handling

This application includes a comprehensive error handling system:

### Error Boundary Component

The `ErrorBoundary` component (`components/error-boundary.tsx`) catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features:**
- Catches errors in child components
- Displays a user-friendly error message
- Provides "Try Again" and "Refresh Page" buttons for recovery
- Shows error details in development mode
- Logs errors to console (ready for integration with error tracking services)

**Usage:**

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// With render prop fallback for access to error and reset
<ErrorBoundary
  fallback={({ error, resetError }) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={resetError}>Retry</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

### Next.js Error Pages

- `app/error.tsx` - Route-level error handling
- `app/global-error.tsx` - Root layout error handling
- `app/not-found.tsx` - 404 page

## Tech Stack

- [Next.js 14](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── autodesk/          # Autodesk API routes
│   │       ├── auth/          # Authentication endpoints
│   │       ├── hubs/          # Hub endpoints
│   │       ├── projects/      # Project endpoints
│   │       └── issues/        # Issues endpoints
│   ├── integrations/
│   │   ├── page.tsx           # Integration hub
│   │   └── autodesk/          # Autodesk integration page
│   └── projects/              # Project management pages
├── components/
│   ├── autodesk/              # Autodesk UI components
│   └── error-boundary.tsx     # Error handling
└── lib/
    ├── autodesk/              # Autodesk service layer
    │   ├── types.ts           # TypeScript types
    │   ├── auth.ts            # OAuth authentication
    │   └── api.ts             # API client
    ├── types.ts               # Core app types
    └── data.ts                # Sample data
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTODESK_CLIENT_ID` | Autodesk application Client ID | Yes (for integration) |
| `AUTODESK_CLIENT_SECRET` | Autodesk application Client Secret | Yes (for integration) |
| `AUTODESK_CALLBACK_URL` | OAuth callback URL | No (defaults to app URL) |
| `NEXT_PUBLIC_APP_URL` | Public application URL | No (defaults to localhost) |

## License

This project is private and proprietary.
