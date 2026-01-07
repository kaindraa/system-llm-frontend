# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Set backend API URL for production
ENV NEXT_PUBLIC_API_BASE_URL="https://system-llm-backend-121635597125.asia-southeast2.run.app/api/v1"
ENV NEXT_PUBLIC_APP_NAME="System LLM"

# Install pnpm
ARG PNPM_VERSION=10.20.0
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Build application with standalone output
RUN pnpm run build

# Remove development dependencies - but keep next and essential packages
RUN pnpm prune --prod


# Final stage for app image
FROM base

# Copy built application from build stage
# Copy the standalone build output (has node_modules via .pnpm)
COPY --from=build /app/.next/standalone /app
# Copy pruned node_modules (has production dependencies)
COPY --from=build /app/node_modules /app/node_modules
# Copy static assets
COPY --from=build /app/.next/static /app/.next/static

# WORKDIR should be /app
WORKDIR /app

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["node", "node_modules/next/dist/bin/next", "start"]
