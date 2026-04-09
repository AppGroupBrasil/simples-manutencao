#!/bin/bash
docker rm -f simples-api 2>/dev/null
docker run -d \
  --name simples-api \
  --network coolify \
  --restart unless-stopped \
  -v /root/simples-manutencao/data:/data \
  -e API_KEY=sm-admin-key-2025 \
  -e BASE_URL=https://simplesmanutencao.com.br \
  -e GMAIL_USER=appgroupbrasil@gmail.com \
  -e GMAIL_PASS=zqrqfptjwprqirlw \
  -l traefik.enable=true \
  -l 'traefik.http.routers.simples-api.entrypoints=https' \
  -l 'traefik.http.routers.simples-api.rule=Host(`api.simplesmanutencao.com.br`)' \
  -l 'traefik.http.routers.simples-api.tls=true' \
  -l 'traefik.http.routers.simples-api.tls.certresolver=letsencrypt' \
  -l 'traefik.http.services.simples-api.loadbalancer.server.port=3001' \
  simples-api
