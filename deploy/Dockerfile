FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
