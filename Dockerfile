FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Railway sets PORT dynamically — use shell form so $PORT expands
CMD uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
