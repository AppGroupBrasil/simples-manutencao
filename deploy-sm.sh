#!/bin/bash
# Deploy blue/green simples-manutencao (frontend principal)
set -uo pipefail

cd /root/simples-manutencao

NEW_IMAGE=simples-manutencao:next
TEST_NAME=simples-manutencao-test
TEST_PORT=3503
PROD_NAME=simples-manutencao
COOLIFY_NAME=w8wkgccsk0000ok8ow0sks0s-223624228356

echo '[1/6] Build...'
docker build -t $NEW_IMAGE . || { echo 'BUILD FALHOU - Coolify intacto'; exit 1; }

echo "[2/6] Container teste porta $TEST_PORT (sem Traefik)..."
docker rm -f $TEST_NAME 2>/dev/null
docker run -d --name $TEST_NAME --network coolify -p 127.0.0.1:$TEST_PORT:80 $NEW_IMAGE

echo '[3/6] Aguarda boot 5s e valida...'
sleep 5
HTTP=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$TEST_PORT/)
if [ "$HTTP" != "200" ] && [ "$HTTP" != "301" ] && [ "$HTTP" != "302" ]; then
  echo "VALIDACAO FALHOU (HTTP $HTTP) - Coolify intacto"
  docker logs --tail 20 $TEST_NAME
  docker rm -f $TEST_NAME
  exit 1
fi
echo "Teste OK ($HTTP)"

echo '[4/6] Swap: para Coolify e sobe novo...'
docker stop $COOLIFY_NAME 2>/dev/null || true
docker rm -f $PROD_NAME 2>/dev/null

docker run -d --name $PROD_NAME --network coolify --restart unless-stopped \
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
  $NEW_IMAGE

echo '[5/6] Aguarda producao...'
sleep 6
PROD=$(curl -sk -o /dev/null -w '%{http_code}' https://simplesmanutencao.com.br/)
echo "Producao retornou $PROD"

if [ "$PROD" != "200" ] && [ "$PROD" != "301" ] && [ "$PROD" != "302" ]; then
  echo 'PRODUCAO FALHOU - ROLLBACK Coolify'
  docker rm -f $PROD_NAME
  docker start $COOLIFY_NAME
  exit 1
fi

echo '[6/6] Cleanup'
docker rm -f $TEST_NAME 2>/dev/null
echo "SM DEPLOY OK. Coolify ($COOLIFY_NAME) parado como backup."
