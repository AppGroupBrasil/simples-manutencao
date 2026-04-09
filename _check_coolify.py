import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())

# Test key auth
c.connect('46.225.191.114', 22, 'root', key_filename='C:/Users/HP/.ssh/hetzner_key',
          timeout=30, allow_agent=False, look_for_keys=False)
print('SSH KEY: OK')

# Check all containers
i, o, e = c.exec_command('docker ps --format "table {{.Names}}\\t{{.Status}}"')
print('\nContainers:')
print(o.read().decode().strip())

# Find Coolify container
i, o, e = c.exec_command('docker ps --format "{{.Names}}" | grep -i coolify')
containers = o.read().decode().strip()
print(f'\nCoolify containers found: {containers}')

# Try to reset Coolify password
if containers:
    coolify_container = [x for x in containers.split('\n') if 'coolify' in x.lower() and 'proxy' not in x.lower() and 'realtime' not in x.lower()]
    if coolify_container:
        name = coolify_container[0].strip()
        print(f'\nResetando senha do Coolify no container: {name}')
        # Write a PHP script into the container, then run it
        php_code = "<?php \\$u = App\\\\Models\\\\User::first(); \\$u->password = bcrypt('Simples2025!'); \\$u->save(); echo 'Email: ' . \\$u->email . PHP_EOL;"
        i, o, e = c.exec_command(f'docker exec {name} bash -c "echo \\"{php_code}\\" > /tmp/reset.php"')
        o.read(); e.read()
        cmd = f'docker exec {name} php artisan tinker < /dev/null --execute "$(cat /tmp/reset_coolify.txt)" 2>&1'
        # Simpler approach: use bash heredoc via exec_command
        reset_cmd = f"""docker exec {name} bash -c 'cd /var/www/html && php -r "
require_once \\"/var/www/html/vendor/autoload.php\\";
\\$app = require_once \\"/var/www/html/bootstrap/app.php\\";
\\$app->make(\\\"Illuminate\\\\Contracts\\\\Console\\\\Kernel\\\")->bootstrap();
\\$u = App\\\\Models\\\\User::first();
\\$u->password = bcrypt(\\\"Simples2025!\\\");
\\$u->save();
echo \\\"Email: \\\" . \\$u->email . \\\"\\n\\\";
echo \\\"Senha resetada!\\n\\\";
"'"""
        i, o, e = c.exec_command(reset_cmd)
        out = o.read().decode().strip()
        err = e.read().decode().strip()
        print(f'  Output: {out}')
        if err:
            print(f'  Err: {err[-300:]}')
    else:
        print('Container principal do Coolify nao identificado. Containers:', containers)
else:
    print('Nenhum container Coolify encontrado!')

c.close()
