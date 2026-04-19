# Base image use karein
FROM python:3.10-slim

# Working directory set karein
WORKDIR /app

# Dependencies copy aur install karein
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baaki sara code copy karein
COPY . .

# FastAPI ko run karne ki command (Port 8080 GCP standard hai)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]