FROM node:20-slim

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm install --production

# Copy all source code
COPY src ./src
COPY lib ./lib
COPY tsconfig.json ./

# Start
EXPOSE 4000
CMD ["npx", "tsx", "src/main.ts"]
