// Sentry config for the browser. Runs in the client bundle.
// (Replaces the old sentry.client.config.ts in SDK v9+.)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://47a6308de394e87af85ecdf04009c8ba@o4511339580882944.ingest.us.sentry.io/4511557540904960",

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: record 10% of normal sessions, 100% of sessions with errors.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  environment: process.env.NODE_ENV,

  integrations: [Sentry.replayIntegration()],
});

// Required for navigation instrumentation (page transitions) in the App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
