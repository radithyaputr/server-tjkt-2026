FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tailwind.config.js src/input.css ./
RUN npx tailwindcss -i ./src/input.css -o ./public/style.css --minify 2>/dev/null || mkdir -p public

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tzdata iputils
ENV TZ=Asia/Jakarta

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY --from=builder /app/public/style.css ./public/style.css 2>/dev/null || true

RUN mkdir -p /app/repository /app/repository/memories && \
    chown -R node:node /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

USER node
CMD ["node", "src/index.js"]
