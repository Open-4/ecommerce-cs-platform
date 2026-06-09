# ============================================
# Railway 专用 Dockerfile (pnpm monorepo)
# ============================================
FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace configs
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY tsconfig.base.json ./

# Copy all packages source
COPY packages/shared ./packages/shared
COPY packages/core ./packages/core
COPY packages/llm-gateway ./packages/llm-gateway
COPY packages/adapters ./packages/adapters
COPY packages/api ./packages/api

# Install dependencies
RUN pnpm install --frozen-lockfile

EXPOSE 4000

# Start API with tsx from root node_modules
CMD ["./node_modules/.bin/tsx", "packages/api/src/main.ts"]
