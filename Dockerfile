# 1. Build frontend assets
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
COPY client ./client

# ✅ Install and build inside the client folder
RUN cd client && npm install && npm run build

# 2. Setup backend runtime
FROM node:18
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

# ✅ Copy built frontend correctly
COPY --from=build /app/client/dist ./client/dist
COPY server ./server

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
