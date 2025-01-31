FROM python:3.12-slim

WORKDIR /app

# Copy package files
COPY pyproject.toml setup.py requirements.txt ./

# Install package
RUN pip install --no-cache-dir .

# Copy application code
COPY ./app ./app

# Run the application
ENV PORT=8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
