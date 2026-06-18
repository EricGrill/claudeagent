# Elizabethtown Jiu-Jitsu

A Next.js application for Elizabethtown Jiu-Jitsu.

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
