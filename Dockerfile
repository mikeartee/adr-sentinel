# Base image — change this line to exercise Scenario D (e.g. node:20-alpine -> node:22-alpine).
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json ./
RUN npm install --omit=dev

# Copy the application source.
COPY src ./src

# Service — the app listens on this port.
EXPOSE 3000

CMD ["node", "src/server.js"]
