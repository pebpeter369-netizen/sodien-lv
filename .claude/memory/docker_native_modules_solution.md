---
name: Docker Native Module Compilation — Alpine vs Debian
description: Alpine Linux (musl libc) incompatible with native modules; use node:22-slim (glibc) for production
type: feedback
---

**Problem:** Native modules like better-sqlite3 fail in Alpine Docker with "Exec format error" despite `npm rebuild --build-from-source` in the Dockerfile. The rebuild completes but at runtime the binary is incompatible.

**Root Cause:** Alpine Linux uses musl libc, while most precompiled native modules and glibc-compiled binaries expect glibc. Even if you rebuild from source in Alpine, the binary format/linking is incompatible with what Node expects at runtime.

**Solution:** Use `node:22-slim` (Debian-based) instead of `node:22-alpine`.

- Alpine: Minimal (~180MB), but uses musl libc — incompatible with most native modules
- Slim (Debian): Larger (~200MB), but uses glibc — standard for native module compilation

**Docker Changes Required:**

```dockerfile
# Before (BROKEN)
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++ cairo-dev

# After (WORKS)
FROM node:22-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential \
    && rm -rf /var/lib/apt/lists/*
```

**Additional Fixes:**
1. **Permissions on .next directory**: Create `.next/cache` in Dockerfile and `chown -R nextjs:nextjs /app` to prevent "EACCES: permission denied" errors at runtime
2. **User setup**: Use `useradd -m -u 1001 nextjs` instead of `addgroup/adduser` (simpler, more standard)

**When to Use This Pattern:**

- **Use node:22-slim**: Always, for production Docker images with any native dependencies (better-sqlite3, node-gyp modules, etc.)
- **Use node:22-alpine**: Only for lightweight dev/debug containers where native modules aren't needed

**Why:** The 20MB size difference is worth the compatibility gain. Native module compilation failures are much harder to debug than image size.
