FROM node:22-alpine AS builder

WORKDIR /app

# Copy root dependency files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/api/prisma.config.ts ./src/api/prisma.config.ts
COPY src/api/prisma ./src/api/prisma

RUN npm install

# Copy source code
COPY src ./src

# Generate prisma client & build nestjs
RUN npm run prisma:generate
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/api/prisma ./src/api/prisma

EXPOSE 4000

CMD ["node", "dist/main.js"]
