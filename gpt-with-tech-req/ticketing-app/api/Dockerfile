# api/Dockerfile

# 1. Base image
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies for Prisma (needed for OpenSSL & query engine)
RUN apk add --no-cache \
    openssl \
    bash \
    curl \
    libc6-compat \
    python3 \
    make \
    g++

# Copy package manifests
COPY package*.json ./

# Install dependencies (use --legacy-peer-deps to avoid conflicts)
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Prisma Client needs schema before generate
RUN npx prisma generate

# Build the Next.js API project
RUN npm run build

# 2. Production image
FROM node:18-alpine AS runner
WORKDIR /app

RUN apk add --no-cache \
    openssl \
    bash \
    curl \
    libc6-compat

ENV NODE_ENV=production

# Copy built app and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/public ./public
COPY --from=base /app/templates ./templates
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/lib ./lib
COPY --from=base /app/pages ./pages
COPY --from=base /app/docs ./docs
COPY --from=base /app/next.config.js ./

# Expose the Next.js API port
EXPOSE 3000

# Add a small wait-for-db script to avoid race conditions
COPY scripts/wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

# Start command with DB wait + Prisma migrate deploy + seed
CMD wait-for-it db:5432 -t 30 -- \
    sh -c "npx prisma migrate deploy && node prisma/seed.cjs && npm start"
