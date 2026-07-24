FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY worker/worker.mjs /app/worker.mjs

ENV NODE_ENV=production
CMD ["node", "/app/worker.mjs"]
