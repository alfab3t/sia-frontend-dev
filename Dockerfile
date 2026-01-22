FROM alpine/git:v2.49.0

# Install curl dan jq
RUN apk add --no-cache curl jq \
    && addgroup -g 1000 appuser \
    && adduser -D -u 1000 -G appuser appuser

# Gunakan user non-root
USER appuser

# Default command
CMD ["sh"]

FROM node:22-alpine AS builder

WORKDIR /app

RUN addgroup -g 1001 appgroup \
    && adduser -D -u 1001 -G appgroup appuser

COPY package*.json ./
COPY package-lock.json ./   
RUN npm ci --legacy-peer-deps --ignore-scripts

COPY . .

# Build the app
RUN npm run build

# --- Stage 2: Production image ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

RUN addgroup -g 1001 appgroup \
    && adduser -D -u 1001 -G appgroup appuser

# Only copy build output + minimal runtime dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Ubah kepemilikan file agar bisa diakses user non-root
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 4001

CMD ["npm", "run", "start"]
