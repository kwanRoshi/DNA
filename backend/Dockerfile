FROM python:3.12-slim

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir -r requirements.txt

ENV PORT=8000
ENV PYTHONPATH=/app

CMD ["python", "main.py"]
