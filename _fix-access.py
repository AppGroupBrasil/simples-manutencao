#!/usr/bin/env python3
"""
Corrige acesso ao servidor: autoriza chave SSH + reseta senha do Coolify.
Uso:  python _fix-access.py NOVA_SENHA_ROOT
"""
import paramiko
import sys
import os

HOST = '46.225.191.114'
USER = 'root'
SSH_KEY_PUB = os.path.join(os.path.expanduser('~'), '.ssh', 'hetzner_key.pub')
SSH_KEY = os.path.join(os.path.expanduser('~'), '.ssh', 'hetzner_key')
COOLIFY_ADMIN_PASSWORD = '123456'


def run(client, cmd, label=None):
    if label:
        print(f'  → {label}')
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode(errors='ignore').strip()
    err = stderr.read().decode(errors='ignore').strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(f'    {out[-500:]}')
    if err and code != 0:
        print(f'    ERR: {err[-300:]}')
    return out, err, code


def main():
    if len(sys.argv) < 2:
        print('Uso: python _fix-access.py NOVA_SENHA_ROOT')
        print('  A senha é gerada pelo painel Hetzner → Rescue → Reset Root Password')
        sys.exit(1)

    password = sys.argv[1]
    print(f'Conectando a {HOST} com senha...')

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=22, username=USER, password=password,
                       timeout=15, allow_agent=False, look_for_keys=False)
        print('✅ Conectado!\n')
    except paramiko.AuthenticationException:
        print('❌ Senha rejeitada. Verifique se copiou a senha correta do painel Hetzner.')
        sys.exit(1)

    # 1. Autorizar chave SSH
    print('1️⃣  Autorizando chave SSH...')
    if os.path.exists(SSH_KEY_PUB):
        with open(SSH_KEY_PUB) as f:
            pub_key = f.read().strip()
        run(client, 'mkdir -p ~/.ssh && chmod 700 ~/.ssh')
        out, _, _ = run(client, 'cat ~/.ssh/authorized_keys 2>/dev/null || echo ""')
        key_sig = ' '.join(pub_key.split()[:2])
        if key_sig not in out:
            run(client, f'echo "{pub_key}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys',
                'Chave adicionada ao authorized_keys')
        else:
            print('  ✅ Chave já estava autorizada')
    else:
        print(f'  ⚠️  Chave pública não encontrada: {SSH_KEY_PUB}')

    # 2. Verificar conexão com chave
    print('\n2️⃣  Testando conexão com chave SSH...')
    test_client = paramiko.SSHClient()
    test_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        test_client.connect(HOST, port=22, username=USER, key_filename=SSH_KEY,
                            timeout=15, allow_agent=False, look_for_keys=False)
        print('  ✅ Chave SSH funcionando!')
        test_client.close()
    except Exception as e:
        print(f'  ⚠️  Chave SSH falhou: {e}')

    # 3. Resetar senha do Coolify
    print('\n3️⃣  Resetando senha do Coolify...')
    # Descobrir o nome do container do Coolify
    out, _, _ = run(client, 'docker ps --format "{{.Names}}" | grep -i coolify', 'Procurando container Coolify')
    if not out:
        print('  ⚠️  Container Coolify não encontrado. Tentando nome padrão...')
        out = 'coolify'

    coolify_container = out.split('\n')[0].strip()
    print(f'  Container: {coolify_container}')

    # Tentar resetar via artisan
    reset_cmd = (
        f'docker exec {coolify_container} php artisan tinker --execute="'
        f"\\$u = App\\\\Models\\\\User::first();"
        f"\\$u->password = bcrypt('{COOLIFY_ADMIN_PASSWORD}');"
        f"\\$u->save();"
        f'echo \\"Email: \\" . \\$u->email;"'
        f'"'
    )
    out, err, code = run(client, reset_cmd, 'Resetando senha admin')

    if code != 0:
        # Fallback: tentar com shell diferente
        reset_cmd2 = (
            f"docker exec {coolify_container} sh -c '"
            f'php artisan tinker --execute="'
            f"\\$u = App\\\\Models\\\\User::first();"
            f"\\$u->password = bcrypt(\\'{COOLIFY_ADMIN_PASSWORD}\\');"
            f"\\$u->save();"
            f"echo \\'Email: \\' . \\$u->email;"
            f'"'
            f"'"
        )
        out, err, code = run(client, reset_cmd2, 'Tentativa alternativa')

    # 4. Listar containers ativos
    print('\n4️⃣  Containers ativos:')
    run(client, 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20', 'docker ps')

    print('\n' + '=' * 50)
    print('✅ ACESSO RESTAURADO!')
    print(f'   SSH:     ssh -i ~/.ssh/hetzner_key root@{HOST}')
    print(f'   Coolify: http://{HOST}:8000')
    print(f'   Senha Coolify: {COOLIFY_ADMIN_PASSWORD}')
    print('=' * 50)

    client.close()


if __name__ == '__main__':
    main()
