# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Patch Next.js 16 generateBuildId bug
RUN node -e "const fs=require('fs');const f='node_modules/next/dist/build/generate-build-id.js';let c=fs.readFileSync(f,'utf8');c=c.replace('let buildId = await generate()','let buildId = typeof generate===\"function\" ? await generate() : null');fs.writeFileSync(f,c);"

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy seed database to a separate location (volume will mount over /app/data)
COPY --from=builder /app/data ./data-seed
COPY --from=builder /app/src/data ./src/data

# Create data directory for volume mount
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/data-seed

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
