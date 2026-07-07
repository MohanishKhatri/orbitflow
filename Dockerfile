# ============================================
# Stage 1: Install Python Dependencies
# ============================================
FROM python:3.13-slim AS dependencies

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=orbitflow.settings

WORKDIR /app

# Copy pre-installed Python packages from the dependency stage
COPY --from=dependencies /install /usr/local

# Copy application source code
COPY . .

# Setup entrypoint and create static files directory
RUN chmod +x /app/entrypoint.sh && \
    mkdir -p /app/staticfiles

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["gunicorn", "orbitflow.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--threads", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
