# Use official Node.js LTS (slim for smaller image)
FROM node:22-slim

# Install native build tools needed by better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for native build), then prune
RUN npm ci

# Copy the rest of the source code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose the port (default 3000)
EXPOSE 3000

# Start the server (env vars are provided by Vultr at runtime, no --env-file needed)
CMD ["node", "--experimental-sqlite", "src/index.js"]
