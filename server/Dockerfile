FROM node:20-alpine AS builder

ARG CACHE_BUST=3
RUN echo "Cache bust: $CACHE_BUST"

WORKDIR /app

COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

# Build and immediately verify output exists
RUN npm run build && ls -la dist/ && echo "✅ dist/main.js exists" || (echo "❌ nest build failed, trying tsc directly" && ./node_modules/.bin/tsc -p tsconfig.json)

RUN test -f dist/main.js || (echo "❌ dist/main.js NOT FOUND after build" && exit 1)

# ─── Production image ───────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/main"]