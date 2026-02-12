FROM python:3.12-slim AS builder

WORKDIR /src

COPY requirements.txt .

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq-dev \
        python3-dev \
        gcc && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

WORKDIR /src

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq5 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 8000 --limit-max-requests 1000 --limit-concurrency 1000 --timeout-keep-alive 75 --timeout-graceful-shutdown 30
