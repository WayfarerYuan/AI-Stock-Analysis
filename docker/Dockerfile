# ===================================
# Stage 1: Build Frontend
# ===================================
FROM docker1ms.run/node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend source
COPY realweb/frontend/package.json ./
COPY realweb/frontend/tsconfig.json ./
COPY realweb/frontend/tsconfig.node.json ./
COPY realweb/frontend/vite.config.ts ./
COPY realweb/frontend/index.html ./
COPY realweb/frontend/postcss.config.js ./
COPY realweb/frontend/tailwind.config.js ./
COPY realweb/frontend/src ./src

# Install and build
RUN npm install
RUN npm run build

# ===================================
# Stage 2: Runtime Environment
# ===================================
FROM docker1ms.run/python:3.11-slim

WORKDIR /app

# Setup timezone
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install extra dependencies for RealWeb
RUN pip install --no-cache-dir fastapi uvicorn

# Copy application code
COPY *.py ./
COPY data_provider/ ./data_provider/
COPY web/ ./web/
COPY bot/ ./bot/
COPY src/ ./src/
COPY realweb/ ./realweb/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/realweb/static

# Create data directories
RUN mkdir -p /app/data /app/logs /app/reports

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV LOG_DIR=/app/logs
ENV DATABASE_PATH=/app/data/stock_analysis.db
ENV WEBUI_HOST=0.0.0.0
ENV WEBUI_PORT=8000

# Expose port
EXPOSE 8000

# Volumes
VOLUME ["/app/data", "/app/logs", "/app/reports"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || python -c "import sys; sys.exit(0)"

# Default command (Launch RealWeb)
CMD ["python", "realweb/launcher.py"]
