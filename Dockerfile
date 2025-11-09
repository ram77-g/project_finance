# 1. Build frontend assets
FROM node:18 AS build
WORKDIR /app

# ✅ Copy all necessary files for Vite build (since vite.config.ts is in root)
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.js ./
COPY postcss.config.cjs ./
COPY client ./client

# ✅ Install dependencies and build frontend
RUN npm install
RUN npm run build

# 2. Setup backend runtime
FROM node:18
WORKDIR /app

ENV NODE_ENV=production

# ✅ Install backend dependencies
COPY package*.json ./
RUN npm install --omit=dev

# ✅ Copy built frontend and backend
COPY --from=build /app/dist ./client/dist
COPY server ./server

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
