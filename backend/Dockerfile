# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json ./
RUN npm ci

COPY backend/src/          ./src/
COPY backend/prisma/       ./prisma/
COPY backend/prisma.config.ts ./prisma.config.ts

RUN npx prisma generate && npm run build

# ── Stage 2: Production runner ───────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl \
 && addgroup -g 1001 -S nodejs \
 && adduser  -S nestjs -u 1001

COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/dist            ./dist
COPY backend/prisma/                     ./prisma/
COPY backend/prisma.config.ts            ./prisma.config.ts
COPY backend/docker-entrypoint.sh        ./docker-entrypoint.sh

RUN mkdir -p prisma/migrations \
 && chmod +x docker-entrypoint.sh \
 && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3004

ENTRYPOINT ["./docker-entrypoint.sh"]
