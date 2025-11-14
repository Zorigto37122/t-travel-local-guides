FROM python:3.12-slim AS builder

WORKDIR /src

COPY requirements.txt .

RUN apt-get update && \
    pip install --no-cache-dir --upgrade pip && \
    apt-get install -y libpq-dev python3-dev gcc && \
    pip install --no-cache-dir -r requirements.txt


FROM python:3.12-slim

WORKDIR /src

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
