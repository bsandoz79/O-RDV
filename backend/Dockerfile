FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev

COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
