param(
  [int]$Port = 3001,
  [string]$BaseUrl
)

if (-not $BaseUrl) { $BaseUrl = "http://localhost:$Port" }
Write-Host "Smoke test contra $BaseUrl" -ForegroundColor Cyan

function Invoke-Json {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Url,
    [hashtable]$Headers,
    [object]$Body
  )
  try {
    if ($Body) { $json = ($Body | ConvertTo-Json -Depth 5) } else { $json = $null }
    $resp = Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -Body $json -ContentType 'application/json'
    return @{ ok=$true; data=$resp }
  }
  catch {
    return @{ ok=$false; error=$_.Exception.Message; response=$_.ErrorDetails.Message }
  }
}

# 1) Health
$health = Invoke-Json -Method GET -Url "$BaseUrl/health"
if (-not $health.ok) { Write-Host "[FAIL] /health => $($health.error)" -ForegroundColor Red; exit 1 }
Write-Host "[OK] /health" -ForegroundColor Green

# 2) Registrar usuário (usar sufixo para evitar conflitos)
$suffix = (Get-Date).ToString('yyyyMMddHHmmss')
$email = "smoke_$suffix@example.com"
$password = "SenhaForte123!"
$registerBody = @{ email=$email; senha=$password; nome="Smoke $suffix" }
$reg = Invoke-Json -Method POST -Url "$BaseUrl/auth/register" -Body $registerBody
if (-not $reg.ok) { Write-Host "[FAIL] /auth/register => $($reg.error) $($reg.response)" -ForegroundColor Red; exit 1 }
Write-Host "[OK] /auth/register: $email" -ForegroundColor Green

# 3) Login e obter token
$loginBody = @{ email=$email; senha=$password }
$login = Invoke-Json -Method POST -Url "$BaseUrl/auth/login" -Body $loginBody
if (-not $login.ok -or -not $login.data -or -not $login.data.access_token) { Write-Host "[FAIL] /auth/login => $($login.error) $($login.response)" -ForegroundColor Red; exit 1 }
$token = $login.data.access_token
$authHeaders = @{ Authorization = "Bearer $token" }
Write-Host "[OK] /auth/login" -ForegroundColor Green

# 4) GET /rota (duas vezes para demonstrar cache)
$rotaUrl = "$BaseUrl/rota?origem=Sao%20Paulo&destino=Rio%20de%20Janeiro&modo=DRIVING"
$rota1 = Measure-Command { $global:r1 = Invoke-Json -Method GET -Url $rotaUrl -Headers $authHeaders }
if (-not $r1.ok) { Write-Host "[FAIL] /rota (1) => $($r1.error) $($r1.response)" -ForegroundColor Red; exit 1 }
$rota2 = Measure-Command { $global:r2 = Invoke-Json -Method GET -Url $rotaUrl -Headers $authHeaders }
if (-not $r2.ok) { Write-Host "[FAIL] /rota (2) => $($r2.error) $($r2.response)" -ForegroundColor Red; exit 1 }
Write-Host ("[OK] /rota: 1ª={0}ms, 2ª={1}ms" -f [int]$rota1.TotalMilliseconds, [int]$rota2.TotalMilliseconds) -ForegroundColor Green

# 5) POST /favoritos (se existir endpoint)
$favBody = @{ origem="Sao Paulo"; destino="Rio de Janeiro"; modo="DRIVING" }
$fav = Invoke-Json -Method POST -Url "$BaseUrl/favoritos" -Headers $authHeaders -Body $favBody
if ($fav.ok) { Write-Host "[OK] /favoritos (POST)" -ForegroundColor Green } else { Write-Host "[WARN] /favoritos (POST) => $($fav.error)" -ForegroundColor Yellow }

# 6) GET /favoritos
$favGet = Invoke-Json -Method GET -Url "$BaseUrl/favoritos" -Headers $authHeaders
if ($favGet.ok) {
  $favCount = 0
  if ($favGet.data) { $favCount = ($favGet.data | Measure-Object).Count }
  Write-Host ("[OK] /favoritos (GET) => {0} itens" -f $favCount) -ForegroundColor Green
} else {
  Write-Host "[WARN] /favoritos (GET) => $($favGet.error)" -ForegroundColor Yellow
}

# 7) GET /historico
$hist = Invoke-Json -Method GET -Url "$BaseUrl/historico" -Headers $authHeaders
if (-not $hist.ok -or -not ($hist.data -is [System.Array])) { Write-Host "[FAIL] /historico => $($hist.error) $($hist.response)" -ForegroundColor Red; exit 1 }
if ($hist.data.Count -lt 1) { Write-Host "[WARN] /historico vazio" -ForegroundColor Yellow } else { Write-Host ("[OK] /historico => {0} itens" -f $hist.data.Count) -ForegroundColor Green }

# 8) Métricas
$metrics = Invoke-Json -Method GET -Url "$BaseUrl/metrics"
if ($metrics.ok) { Write-Host "[OK] /metrics" -ForegroundColor Green } else { Write-Host "[WARN] /metrics => $($metrics.error)" -ForegroundColor Yellow }

Write-Host "Smoke test finalizado com sucesso." -ForegroundColor Cyan
