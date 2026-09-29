# Multi-stage Dockerfile for Cloud-Hobby-Skills-Tracker
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Unified Static Serving
FROM python:3.11-slim
WORKDIR /app

# Prevent Python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, cloud modules, analytics, and static frontend build
COPY backend/ ./backend/
COPY cloud/ ./cloud/
COPY analytics/ ./analytics/
COPY sample_data/ ./sample_data/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create storage upload directory
RUN mkdir -p uploads/profiles uploads/posts uploads/skills

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
