# Data Generator Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Set environment variables
ENV NODE_ENV=production

# Run the generator
CMD ["node", "src/index.js"]
