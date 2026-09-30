FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY images/ /app/images/

RUN useradd -m app && mkdir /data && chown app /data \
    && chmod +x entrypoint.sh
USER app

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]