# ============================================
# ECS API - Production Dockerfile
# ============================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/core/package.json packages/core/
COPY packages/llm-gateway/package.json packages/llm-gateway/
COPY packages/adapters/base-adapter/package.json packages/adapters/base-adapter/
COPY packages/api/package.json packages/api/
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @ecs/api build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY packages/core ./packages/core
COPY packages/llm-gateway ./packages/llm-gateway
COPY packages/adapters ./packages/adapters

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000
CMD ["node", "dist/main.js"]
