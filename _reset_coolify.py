import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('46.225.191.114', 22, 'root', key_filename='C:/Users/HP/.ssh/hetzner_key',
          timeout=30, allow_agent=False, look_for_keys=False)
print('SSH KEY: OK')

def run(cmd):
    i, o, e = c.exec_command(cmd)
    out = o.read().decode(errors='ignore').strip()
    err = e.read().decode(errors='ignore').strip()
    return out, err

# Step 1: Write a PHP reset script inside the container
php_script = r'''<?php
require_once '/var/www/html/vendor/autoload.php';
$app = require_once '/var/www/html/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$u = \App\Models\User::first();
$u->password = bcrypt('Simples2025!');
$u->save();
echo "Email: " . $u->email . "\n";
echo "Senha resetada para: Simples2025!\n";
'''

# Write the PHP script to a temp file on the host, then copy into container
print('\n1. Escrevendo script PHP...')
# Use heredoc to write file on server
out, err = run("cat > /tmp/reset_coolify.php << 'PHPEOF'\n" + php_script + "\nPHPEOF")
print(f'  Write: done')

# Copy into container
out, err = run('docker cp /tmp/reset_coolify.php coolify:/tmp/reset_coolify.php')
print(f'  Copy: done')

# Execute inside container
print('\n2. Executando reset...')
out, err = run('docker exec coolify php /tmp/reset_coolify.php')
print(f'  Output: {out}')
if err:
    print(f'  Err: {err[-400:]}')

# Show Coolify user info
print('\n3. Verificando usuario Coolify...')
out, err = run('docker exec coolify php artisan tinker --trust-project --execute="echo App\\\\Models\\\\User::first()->email;"')
print(f'  Email: {out}')

c.close()
print('\nFeito!')
