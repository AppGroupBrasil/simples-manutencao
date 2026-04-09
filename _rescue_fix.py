import paramiko

HOST = '46.225.191.114'
RESCUE_PASS = 'Te9nkk9RWWx3'
NEW_ROOT_PASS = 'Simples2025!'
PUB_KEY = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA1YU4MNx59YHGwQ04kE2cUpsWmW90a5iCA++9Jkf94Y copilot@manus'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, 'root', RESCUE_PASS, timeout=30, allow_agent=False, look_for_keys=False)
print('CONNECTED to rescue')

def run(cmd):
    i, o, e = c.exec_command(cmd)
    out = o.read().decode(errors='ignore').strip()
    err = e.read().decode(errors='ignore').strip()
    code = o.channel.recv_exit_status()
    if out:
        print(f'  {out[-400:]}')
    if err and code != 0:
        print(f'  ERR: {err[-200:]}')
    return out, code

# 1. Mount
print('\n1. Montando disco...')
run('mount /dev/sda1 /mnt 2>/dev/null; echo ok')
run('mount --bind /dev /mnt/dev')
run('mount --bind /proc /mnt/proc')
run('mount --bind /sys /mnt/sys')
run('mount --bind /dev/pts /mnt/dev/pts')
print('  OK')

# 2. Reset root password
print(f'\n2. Resetando senha root para: {NEW_ROOT_PASS}')
out, code = run(f'chroot /mnt bash -c "echo root:{NEW_ROOT_PASS} | chpasswd"')
print(f'  {"OK" if code == 0 else "FALHOU"}')

# 3. Authorize SSH key
print('\n3. Autorizando chave SSH...')
run('mkdir -p /mnt/root/.ssh; chmod 700 /mnt/root/.ssh')
out, _ = run('cat /mnt/root/.ssh/authorized_keys 2>/dev/null')
if PUB_KEY not in (out or ''):
    run(f'echo "{PUB_KEY}" >> /mnt/root/.ssh/authorized_keys; chmod 600 /mnt/root/.ssh/authorized_keys')
    print('  Chave adicionada')
else:
    print('  Chave ja existia')

# 4. Enable password + root login in sshd
print('\n4. Habilitando login SSH com senha...')
cmds = [
    "sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config",
    "sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config",
]
for cmd in cmds:
    run(f'chroot /mnt bash -c "{cmd}"')
print('  OK')

# 5. Install qemu-guest-agent
print('\n5. Instalando qemu-guest-agent...')
run('cp /etc/resolv.conf /mnt/etc/resolv.conf')
out, code = run('chroot /mnt bash -c "apt-get update -qq; apt-get install -y -qq qemu-guest-agent 2>&1 | tail -5"')
if code == 0:
    print('  OK - qemu-guest-agent instalado')
    run('chroot /mnt bash -c "systemctl enable qemu-guest-agent"')
else:
    print('  AVISO: falhou, mas continua...')

# 6. Cleanup
print('\n6. Desmontando...')
for mp in ['/mnt/dev/pts', '/mnt/dev', '/mnt/proc', '/mnt/sys', '/mnt']:
    run(f'umount {mp} 2>/dev/null; echo ok')

# 7. Reboot
print('\n7. Rebootando servidor (sai do rescue, volta ao sistema normal)...')
run('reboot')

print('\n' + '='*50)
print('PRONTO! Aguarde ~30s e teste:')
print(f'  ssh -i ~/.ssh/hetzner_key root@{HOST}')
print(f'  Ou com senha: {NEW_ROOT_PASS}')
print('='*50)
c.close()
