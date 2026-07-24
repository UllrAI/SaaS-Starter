# Use official Node.js runtime as base image
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.33.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production for build
ARG NEXT_PUBLIC_APP_URL
ARG R2_PUBLIC_URL
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV R2_PUBLIC_URL=$R2_PUBLIC_URL
ENV SKIP_ENV_VALIDATION=1

# Build the Next.js application
RUN test -n "$NEXT_PUBLIC_APP_URL" \
  && test -n "$R2_PUBLIC_URL" \
  && pnpm run build

# One-shot database migration image. It intentionally contains development
# dependencies and source files, but is never used to serve application traffic.
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
USER node
CMD ["pnpm", "db:migrate"]

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

LABEL "language"="nodejs"
LABEL "framework"="next.js"

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the self-contained application prepared by the build script
COPY --from=builder /app/.next/standalone ./

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
