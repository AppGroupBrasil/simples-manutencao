#!/bin/bash
# Deploy API com rotacao + rollback automatico
# Banco SQLite em /root/simples-manutencao/data eh PRESERVADO (volume).
# NAO ha blue/green (SQLite nao suporta 2 escritores).
set -uo pipefail

cd /root/simples-manutencao/api
NEW_IMAGE=simples-api:next
PROD_NAME=simples-api
BACKUP_NAME=simples-api-backup

echo '[1/5] Build nova imagem API...'
docker build -t $NEW_IMAGE . || { echo 'BUILD FALHOU - producao intacta'; exit 1; }

echo '[2/5] Renomeia container atual para backup e para...'
docker rm -f $BACKUP_NAME 2>/dev/null
if docker ps -a --format '{{.Names}}' | grep -q "^$PROD_NAME$"; then
  docker rename $PROD_NAME $BACKUP_NAME
  docker stop $BACKUP_NAME >/dev/null
fi

echo '[3/5] Sobe novo container...'
docker run -d \
  --name $PROD_NAME \
  --network coolify \
  --restart unless-stopped \
  -v /root/simples-manutencao/data:/data \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e API_KEY=945d2c6b5ff1e2732cee84ce7e5273c1ad161d3a73d1141fa38687fd774c1cc77d618c2628b673d5331f34170b1f2b34 \
  -e JWT_SECRET=Pi98buOwvJcivOq8P/g7EjLwk9i4C9EKfD9UPJ+bfnj/CxJwbqH6Et97QGvvhE1z \
  -e PROVISIONING_SECRET=oqYp4Jn7aKEguFqM64HXDgxPZXXJzOp2qXd1B1sYZRk \
  -e JWT_EXPIRES_IN=30d \
  -e BASE_URL=https://simplesmanutencao.com.br \
  -e 'CORS_ORIGINS=https://simplesmanutencao.com.br,https://www.simplesmanutencao.com.br,https://caldo.simplesmanutencao.com.br,https://localhost,capacitor://localhost,http://localhost' \
  -e GMAIL_USER=appgroupbrasil@gmail.com \
  -e GMAIL_PASS=zqrqfptjwprqirlw \
  -e TRIAL_DAYS=7 \
  -l traefik.enable=true \
  -l 'traefik.http.routers.simples-api.entrypoints=https' \
  -l 'traefik.http.routers.simples-api.rule=Host(`api.simplesmanutencao.com.br`)' \
  -l 'traefik.http.routers.simples-api.tls=true' \
  -l 'traefik.http.routers.simples-api.tls.certresolver=letsencrypt' \
  -l 'traefik.http.services.simples-api.loadbalancer.server.port=3001' \
  $NEW_IMAGE

echo '[4/5] Aguarda /health responder (max 30s)...'
for i in {1..15}; do
  sleep 2
  if curl -sf -o /dev/null https://api.simplesmanutencao.com.br/health; then
    echo "API saudavel apos $((i*2))s"
    break
  fi
  if [ $i -eq 15 ]; then
    echo 'API NAO FICOU SAUDAVEL - ROLLBACK'
    docker logs --tail 30 $PROD_NAME
    docker rm -f $PROD_NAME
    docker rename $BACKUP_NAME $PROD_NAME
    docker start $PROD_NAME
    exit 1
  fi
done

echo '[5/5] Cleanup container backup'
docker rm -f $BACKUP_NAME 2>/dev/null
echo 'DEPLOY API OK'
