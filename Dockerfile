# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install build tools for native modules (debian-based)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Patch Next.js 16 generateBuildId bug
RUN node -e "const fs=require('fs');const f='node_modules/next/dist/build/generate-build-id.js';let c=fs.readFileSync(f,'utf8');c=c.replace('let buildId = await generate()','let buildId = typeof generate===\"function\" ? await generate() : null');fs.writeFileSync(f,c);"

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Cache busting for CSS changes (2026-03-29)
RUN echo "Build timestamp: $(date)"

RUN npm run build

# Rebuild better-sqlite3 for the target platform
RUN npm rebuild better-sqlite3 --build-from-source

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN useradd -m -u 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy node_modules with rebuilt native modules
COPY --from=builder /app/node_modules ./node_modules

# Copy seed database to a separate location (volume will mount over /app/data)
COPY --from=builder /app/data ./data-seed
COPY --from=builder /app/src/data ./src/data

# Create data directory and fix permissions
RUN mkdir -p /app/data /app/.next/cache && \
    chown -R nextjs:nextjs /app

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
