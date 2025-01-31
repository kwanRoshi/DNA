FROM python:3.12-slim

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir -r requirements.txt

ENV PORT=8080
ENV HOST=0.0.0.0

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8080"]
