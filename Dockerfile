# --- Stage 1: Build Stage ---
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install system build tools required for native C++ modules (like SQLite)
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy source code and build TypeScript to /dist
COPY . .
RUN npm run build

# --- Stage 2: Production Runner Stage ---
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Install build tools and all project dependencies required by the app and the browser-based test runner.
# Vitest is used by the UI dashboard, so devDependencies must stay available in the runtime image.
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm ci --include=dev \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled JavaScript output from Stage 1
COPY --from=builder /app/dist ./dist

# The in-app test dashboard runs Vitest from the container, so include the test
# sources and their TypeScript configuration in the runtime image.
COPY --from=builder /app/src ./src
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src/vitest.config.ts ./vitest.config.ts

# Create directory for persistent SQLite data
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/index.js"]