# 1. Build frontend assets
FROM node:18 AS build
WORKDIR /app

# ✅ Copy client package.json before installing
COPY client/package*.json ./client/

# ✅ Install and build inside client folder
WORKDIR /app/client
RUN npm install
COPY client/ .
RUN npm run build

# 2. Setup backend runtime
FROM node:18
WORKDIR /app

ENV NODE_ENV=production

# ✅ Install backend dependencies
COPY package*.json ./
RUN npm install --omit=dev

# ✅ Copy built frontend into backend
COPY --from=build /app/client/dist ./client/dist
COPY server ./server

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
