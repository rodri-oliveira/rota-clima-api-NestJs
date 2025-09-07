# Operações — API Clima + Transporte

Este guia consolida os procedimentos de operação (deploy, rollback, migrações, backup/restore, observabilidade) para a API.

## Ambientes e Portas
- Local (fora do Docker): 3000
- Dev (Compose profile "dev"): 3002
- Prod-like (Compose): 3001

## Variáveis de Ambiente (obrigatórias/úteis)
- DATABASE_URL — URL do Postgres
- REDIS_URL — ex.: redis://redis:6379 (em Compose) ou redis://localhost:6379 (local)
- JWT_SECRET — segredo JWT
- CORS_ORIGIN — origens permitidas (ex.: https://app.meudominio.com,https://staging.meudominio.com)
- RATE_LIMIT_MAX — limite por IP a cada 15 min (ex.: 100)
- LOG_LEVEL — info|warn|error (prod), debug (dev)
- OPENWEATHER_API_KEY — opcional (se definido, usa OpenWeather; senão, Open-Meteo)

## Migrações (Prisma)
Dentro de `api-clima-transporte/`:
```powershell
npx prisma migrate deploy
npx prisma generate
```
Observação: o Dockerfile da API já executa `npx prisma generate` no build para garantir engines compatíveis.

## Subir ambientes
- Prod-like (3001) — na raiz do repositório:
```powershell
docker compose up -d postgres redis api
```
- Dev (3002) — na raiz do repositório:
```powershell
docker compose --profile dev up -d api-dev
```
- Local (3000) — Postgres/Redis em Docker e API fora do Docker:
```powershell
# raiz
docker compose up -d postgres redis
# api-clima-transporte/
npm run start:dev
```

## Smoke test (E2E manual)
Na raiz do repositório:
```powershell
# 3001 (prod-like)
./smoke.ps1 -Port 3001
# 3002 (dev)
./smoke.ps1 -Port 3002
# 3000 (local fora do Docker)
./smoke.ps1 -Port 3000
```
O script realiza: health → register → login → GET /rota (2x para evidenciar cache) → favoritos (POST/GET) → histórico → métricas.

## Observabilidade
- Logs estruturados (Pino): JSON em produção, pretty em dev. `X-Request-Id` presente nas respostas.
- Métricas Prometheus: endpoint `/metrics` com:
  - HTTP metrics por rota (contador e histograma)
  - Métricas de cache: `cache_hits_total` e `cache_misses_total` rotuladas por `cache=rota|clima`
- Sugestão: configurar Prometheus/Grafana no ambiente alvo e importar dashboard HTTP + custom de cache.

## Backup e Restore (Postgres)
Exemplos usando Docker (ajuste usuário/DB se necessário):
```bash
# Backup (dump)
docker exec -t rota_clima_postgres pg_dump -U app -d rota_clima > backup_$(date +%F).sql

# Restore
docker exec -i rota_clima_postgres psql -U app -d rota_clima < backup_2025-01-01.sql
```

## Rollback
- Código: efetuar rollback para tag/commit anterior e reimplantar.
- Banco: aplicar `prisma migrate deploy` para voltar ao último estado consistente. Em casos críticos, usar restore de backup.

## Troubleshooting rápido
- Porta em uso: ajuste mapeamento em `docker-compose.yml` (ex.: "3002:3000").
- `Prisma Client` incompatível: revisar `binaryTargets` no `schema.prisma` e executar `npx prisma generate`.
- Falha de rede externa (clima/rotas): a API usa fallback e cache; verificar logs e provider.
- CORS bloqueando requisições: revisar `CORS_ORIGIN` no ambiente.

## CI
- Workflow GitHub Actions em `.github/workflows/ci.yml`
- Executa: npm ci → prisma generate → build → e2e, com serviços Postgres e Redis provisionados.

---

## Dashboards Prometheus/Grafana

Métricas expostas em `/metrics`:
- `http_requests_total` (contador por rota/método/status)
- `http_request_duration_seconds` (histograma por rota)
- `cache_hits_total{cache="rota|clima"}`
- `cache_misses_total{cache="rota|clima"}`

### PromQL — Throughput HTTP por rota (5m)
```
sum by (route) (rate(http_requests_total[5m]))
```

### PromQL — Latência P95 por rota (5m)
```
histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))
```

### PromQL — Latência P99 por rota (5m)
```
histogram_quantile(0.99, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))
```

### PromQL — Erros HTTP (4xx/5xx) por rota (5m)
```
sum by (route, status_code) (rate(http_requests_total{status_code=~"4..|5.."}[5m]))
```

### PromQL — Cache hit ratio (clima) — taxa (5m)
```
sum(rate(cache_hits_total{cache="clima"}[5m]))
/ clamp_min(sum(rate(cache_hits_total{cache="clima"}[5m])) + sum(rate(cache_misses_total{cache="clima"}[5m])), 1)
```

### PromQL — Cache hit ratio (rota) — taxa (5m)
```
sum(rate(cache_hits_total{cache="rota"}[5m]))
/ clamp_min(sum(rate(cache_hits_total{cache="rota"}[5m])) + sum(rate(cache_misses_total{cache="rota"}[5m])), 1)
```

### PromQL — Misses de cache por tipo (5m)
```
sum by (cache) (rate(cache_misses_total[5m]))
```

### Dicas de dashboard
- Cards: requisições/min, taxa de erros (%), P95/P99, hit ratio (rota/clima).
- Gráficos: throughput por rota, latência por rota, hits e misses por tipo.
