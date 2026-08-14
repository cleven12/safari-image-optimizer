# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for sharp
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for sharp
RUN apk add --no-cache vips-dev

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY bin/ ./bin/
COPY lib/ ./lib/
COPY package.json ./

# Create directories for input/output
RUN mkdir -p /input /output

# Set executable permissions
RUN chmod +x bin/safari-opt.js

# Use non-root user
RUN addgroup -g 1001 -S safari && \
    adduser -S safari -u 1001 -G safari
USER safari

ENTRYPOINT ["node", "bin/safari-opt.js"]
CMD ["--help"]
