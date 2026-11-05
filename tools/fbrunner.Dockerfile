# Runner image for tools/fb_runner.py: Python + firebird-driver + libfbclient.
# Used when the host has no Firebird client library (e.g. Windows, macOS).
# tools/ is mounted at runtime, so code changes need no rebuild.
FROM python:3.12-slim-bookworm
RUN apt-get update \
    && apt-get install -y --no-install-recommends libfbclient2 \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir firebird-driver==2.1.2
WORKDIR /app
ENTRYPOINT ["python", "/app/tools/fb_runner.py"]
