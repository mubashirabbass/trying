# Base stage
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY . .

# Build stage
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# Production stage
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copy built server and shared libs
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/shared ./shared
COPY --from=build /app/db/dist ./db/dist
COPY --from=build /app/db/package.json ./db/

# Copy built client to be served by server
COPY --from=build /app/client/dist ./client/dist

# Install production dependencies for server
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile --filter @workspace/api-server --filter @workspace/db

EXPOSE 8080
CMD ["node", "server/dist/index.js"]
