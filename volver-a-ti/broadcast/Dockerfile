# VOLVER A TI · Servidor del directo 24/7
# Renderiza los programas la primera vez (o al cambiar programs.json) y después emite sin parar.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3-numpy python3-scipy fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY assets ./assets
COPY broadcast/package.json broadcast/package-lock.json ./broadcast/
RUN cd broadcast && npm ci --omit=dev
COPY broadcast ./broadcast

ENV FFMPEG=ffmpeg VAT_PYTHON=python3 VAT_OUT=/data/segments VAT_WORKERS=2
VOLUME /data
CMD ["bash", "/app/broadcast/start.sh"]
