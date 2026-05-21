FROM node:18-alpine

WORKDIR /app

# Copie schema Prisma avant npm install (postinstall lance prisma generate)
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev

COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
