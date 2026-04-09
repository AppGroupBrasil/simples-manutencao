#!/usr/bin/env python3
import os
import posixpath
import stat
import sys

import paramiko


HOST = '46.225.191.114'
USER = 'root'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
DOCKERFILE = os.path.join(BASE_DIR, 'Dockerfile.deploy')
NGINX_CONF = os.path.join(BASE_DIR, 'nginx.conf')
DEPLOY_SCRIPT = os.path.join(BASE_DIR, 'deploy-sm.sh')
SSH_KEY = os.path.join(os.path.expanduser('~'), '.ssh', 'hetzner_key')


def run(client, cmd, label=None):
    if label:
        print(f'  -> {label}')
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode(errors='ignore').strip()
    err = stderr.read().decode(errors='ignore').strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(f'    {out[-700:]}')
    if err and code != 0:
        print(f'    ERR: {err[-500:]}')
    return out, err, code


def mkdir_p(sftp, remote_dir):
    parts = remote_dir.strip('/').split('/')
    current = ''
    for part in parts:
        current = f'{current}/{part}' if current else f'/{part}'
        try:
            sftp.stat(current)
        except FileNotFoundError:
            sftp.mkdir(current)


def upload_tree(sftp, local_root, remote_root):
    mkdir_p(sftp, remote_root)
    for root, dirs, files in os.walk(local_root):
        rel = os.path.relpath(root, local_root)
        remote_dir = remote_root if rel == '.' else posixpath.join(remote_root, rel.replace('\\', '/'))
        mkdir_p(sftp, remote_dir)
        for name in files:
            local_path = os.path.join(root, name)
            remote_path = posixpath.join(remote_dir, name)
            print(f'  upload {remote_path}')
            sftp.put(local_path, remote_path)


def connect_with_key():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        port=22,
        username=USER,
        key_filename=SSH_KEY,
        timeout=20,
        allow_agent=False,
        look_for_keys=False,
    )
    return client


def main():
    if not os.path.isdir(DIST_DIR):
        print('dist/ nao encontrado. Rode o build antes do deploy.')
        sys.exit(1)
    if not os.path.exists(SSH_KEY):
        print(f'Chave SSH nao encontrada: {SSH_KEY}')
        sys.exit(1)

    print(f'Conectando a {HOST} com chave SSH...')
    try:
        client = connect_with_key()
    except Exception as exc:
        print(f'Falha ao conectar com chave SSH: {exc}')
        print('Use primeiro o acesso por senha para autorizar a chave no servidor.')
        sys.exit(1)

    print('Conectado.')
    sftp = client.open_sftp()

    remote_root = '/root/simples-manutencao'
    remote_dist = f'{remote_root}/dist'

    print('\n1) Enviando frontend...')
    mkdir_p(sftp, remote_root)
    upload_tree(sftp, DIST_DIR, remote_dist)
    sftp.put(DOCKERFILE, f'{remote_root}/Dockerfile.deploy')
    sftp.put(NGINX_CONF, f'{remote_root}/nginx.conf')
    sftp.put(DEPLOY_SCRIPT, f'{remote_root}/deploy-sm.sh')
    sftp.chmod(f'{remote_root}/deploy-sm.sh', stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
    sftp.close()

    print('\n2) Construindo imagem do frontend...')
    run(client, f'cd {remote_root} && docker build -f Dockerfile.deploy -t simples-manutencao . 2>&1 | tail -20', 'docker build')

    print('\n3) Recriando container do frontend...')
    run(client, 'docker rm -f simples-manutencao 2>/dev/null || true', 'remover container antigo')
    run(client, f'cd {remote_root} && bash deploy-sm.sh 2>&1', 'deploy-sm.sh')
    run(client, 'docker update --restart unless-stopped simples-manutencao', 'garantir restart policy')

    print('\n4) Verificando status...')
    run(client, 'docker ps --filter name=simples-manutencao --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', 'docker ps')
    run(client, 'docker logs --tail 20 simples-manutencao 2>&1', 'logs')

    print('\nDeploy do frontend concluido.')
    client.close()


if __name__ == '__main__':
    main()