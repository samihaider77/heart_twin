FROM python:3.10-slim

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set port
ENV PORT=8080

# Run the backend FastAPI app
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT"]
