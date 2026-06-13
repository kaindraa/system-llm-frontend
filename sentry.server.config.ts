// Sentry config for the Node.js server runtime (App Router server components,
// route handlers, server actions). Loaded via instrumentation.ts.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ??
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://47a6308de394e87af85ecdf04009c8ba@o4511339580882944.ingest.us.sentry.io/4511557540904960",

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to stack traces (server only).
  includeLocalVariables: true,

  enableLogs: true,

  environment: process.env.NODE_ENV,
});
