import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('46.225.191.114', 22, 'root', key_filename='C:/Users/HP/.ssh/hetzner_key',
          timeout=30, allow_agent=False, look_for_keys=False)

i, o, e = c.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "simples|coolify"')
print(o.read().decode().strip())

# Quick health check
i, o, e = c.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:80')
web_code = o.read().decode().strip()
i, o, e = c.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/')
api_code = o.read().decode().strip()
print(f'\nFrontend (porta 80): HTTP {web_code}')
print(f'API (porta 3001): HTTP {api_code}')
c.close()
