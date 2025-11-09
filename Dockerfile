# 1. Build frontend assets
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
COPY client ./client

RUN npm install
RUN npm run build

# 2. Setup backend runtime
FROM node:18
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./client/dist
COPY server ./server

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
