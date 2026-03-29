#!/bin/bash
docker run -d \
  --name simples-manutencao \
  --network coolify \
  --restart unless-stopped \
  -l traefik.enable=true \
  -l 'traefik.http.routers.simples-manutencao.entrypoints=https' \
  -l 'traefik.http.routers.simples-manutencao.rule=Host(`simplesmanutencao.com.br`)' \
  -l 'traefik.http.routers.simples-manutencao.tls=true' \
  -l 'traefik.http.routers.simples-manutencao.tls.certresolver=letsencrypt' \
  -l 'traefik.http.routers.simples-manutencao-www.entrypoints=https' \
  -l 'traefik.http.routers.simples-manutencao-www.rule=Host(`www.simplesmanutencao.com.br`)' \
  -l 'traefik.http.routers.simples-manutencao-www.tls=true' \
  -l 'traefik.http.routers.simples-manutencao-www.tls.certresolver=letsencrypt' \
  -l 'traefik.http.routers.simples-manutencao-www.middlewares=sm-redirect-www' \
  -l 'traefik.http.middlewares.sm-redirect-www.redirectregex.regex=^https://www\.simplesmanutencao\.com\.br/(.*)' \
  -l 'traefik.http.middlewares.sm-redirect-www.redirectregex.replacement=https://simplesmanutencao.com.br/${1}' \
  -l 'traefik.http.middlewares.sm-redirect-www.redirectregex.permanent=true' \
  -l 'traefik.http.services.simples-manutencao.loadbalancer.server.port=80' \
  simples-manutencao
