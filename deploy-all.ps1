param(
  [string]$RootPassword
)

Set-Location $PSScriptRoot

$python = 'C:/Users/HP/AppData/Local/Programs/Python/Python312/python.exe'

Write-Host 'Deploy API...' -ForegroundColor Yellow
if ($RootPassword) {
  & $python .\_deploy-api.py $RootPassword
} else {
  & $python .\_deploy-api.py
}
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Falha no deploy da API.' -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host 'Deploy frontend...' -ForegroundColor Yellow
& $python .\_deploy-web.py
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Falha no deploy do frontend.' -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host 'Deploy completo finalizado.' -ForegroundColor Green