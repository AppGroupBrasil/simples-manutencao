#!/bin/bash
# Deploy blue/green simples-manutencao (frontend principal)
set -uo pipefail

cd /root/simples-manutencao

NEW_IMAGE=simples-manutencao:next
TEST_NAME=simples-manutencao-test
TEST_PORT=3503
PROD_NAME=simples-manutencao
BACKUP_NAME=simples-manutencao-old
HOST_RULE='Host(`simplesmanutencao.com.br`)'

# Encontra containers EM EXECUCAO (exceto os nossos) que detem a rota Traefik do dominio.
# Substitui a deteccao antiga por id fixo do Coolify (name=w8wk...), que quebrava quando o
# sufixo do container mudava a cada redeploy do Coolify -> COOLIFY_NAME vinha vazio, o antigo
# nunca era parado e o Traefik continuava servindo o build velho.
detectar_concorrentes() {
  local c
  for c in $(docker ps --format '{{.Names}}'); do
    [ "$c" = "$PROD_NAME" ] && continue
    [ "$c" = "$TEST_NAME" ] && continue
    if docker inspect "$c" --format '{{json .Config.Labels}}' 2>/dev/null | grep -qF "$HOST_RULE"; then
      echo "$c"
    fi
  done
}

echo '[1/6] Build (Dockerfile: npm build a partir do fonte do git)...'
docker build -t $NEW_IMAGE . || { echo 'BUILD FALHOU - producao intacta'; exit 1; }

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

# Hash do bundle de entrada do build NOVO (para conferir depois se a producao serve ele mesmo)
NEW_HASH=$(curl -s http://127.0.0.1:$TEST_PORT/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
echo "Build novo: ${NEW_HASH:-?}"

echo '[4/6] Swap: guarda prod atual como backup, libera rota e sobe novo...'
CONCORRENTES=$(detectar_concorrentes)
[ -n "$CONCORRENTES" ] && echo "Concorrentes na rota: $CONCORRENTES"
for c in $CONCORRENTES; do docker stop "$c" >/dev/null 2>&1 || true; done

# NAO destroi a producao atual antes de validar a nova: renomeia+para como backup.
# Assim, se o container novo falhar a validacao, o rollback reergue o backup e o
# site nunca fica sem nenhum container servindo a rota (falha do deploy anterior).
docker rm -f $BACKUP_NAME 2>/dev/null
BACKUP_OK=0
if docker inspect $PROD_NAME >/dev/null 2>&1; then
  if docker rename $PROD_NAME $BACKUP_NAME 2>/dev/null; then
    docker stop $BACKUP_NAME >/dev/null 2>&1 || true
    BACKUP_OK=1
  fi
fi

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

rollback() {
  echo "$1"
  docker rm -f $PROD_NAME 2>/dev/null
  # Reergue a producao anterior (backup) se ela existir; senao reergue concorrentes.
  if [ "$BACKUP_OK" = "1" ] && docker rename $BACKUP_NAME $PROD_NAME 2>/dev/null; then
    docker start $PROD_NAME >/dev/null 2>&1 || true
  fi
  for c in $CONCORRENTES; do docker start "$c" >/dev/null 2>&1 || true; done
  docker rm -f $TEST_NAME 2>/dev/null
  exit 1
}

echo '[5/6] Aguarda producao (HTTP 200 + build novo, ate 40s)...'
PROD='' ; PROD_HASH=''
for i in $(seq 1 20); do
  sleep 2
  PROD=$(curl -skL -o /dev/null -w '%{http_code}' https://simplesmanutencao.com.br/)
  [ "$PROD" != "200" ] && continue
  # Sem NEW_HASH nao da pra conferir conteudo; basta o 200
  [ -z "$NEW_HASH" ] && break
  PROD_HASH=$(curl -skL https://simplesmanutencao.com.br/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
  [ "$PROD_HASH" = "$NEW_HASH" ] && break
done
echo "Producao: HTTP $PROD, bundle $PROD_HASH (esperado $NEW_HASH)"

if [ "$PROD" != "200" ]; then
  rollback 'PRODUCAO FALHOU (HTTP) - ROLLBACK (reergue concorrentes)'
fi
# Confere que a producao serve o BUILD NOVO (nao um concorrente com build velho).
# Sem isto o deploy reportava "OK" mesmo com o Traefik apontando pro container antigo.
if [ -n "$NEW_HASH" ] && [ "$PROD_HASH" != "$NEW_HASH" ]; then
  rollback "PRODUCAO SERVINDO BUILD ANTIGO ($PROD_HASH != $NEW_HASH) - ROLLBACK"
fi

echo '[6/6] Cleanup'
docker rm -f $TEST_NAME 2>/dev/null
docker rm -f $BACKUP_NAME 2>/dev/null
echo "SM DEPLOY OK. Concorrentes parados (backup): ${CONCORRENTES:-nenhum}"
