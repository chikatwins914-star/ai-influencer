FROM node:20-slim AS base
WORKDIR /app

# System deps for Playwright (browser automation used for draft/QA checks only)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate --schema=database/schema.prisma
RUN npm run build

EXPOSE 4000
CMD ["npm", "start"]
