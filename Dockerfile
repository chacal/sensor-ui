FROM node:lts-alpine AS base

WORKDIR /app

# Install only production deps.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY public ./public
COPY server.js .

ENV NODE_ENV=production

CMD ["npm", "start"]
