# 🌍 API Clima + Transporte
[![CI](https://github.com/rodri-oliveira/rota-clima-api-NestJs/actions/workflows/ci.yml/badge.svg)](https://github.com/rodri-oliveira/rota-clima-api-NestJs/actions/workflows/ci.yml)

Backend em NestJS com PostgreSQL (Prisma) para consultar rotas e clima, com histórico e favoritos.

## Objetivo
Consolidar informações de transporte e clima em uma única API com boas práticas: testes, logs, observabilidade e deploy.

## Tecnologias
- Node 20 + TypeScript
- NestJS
- PostgreSQL + Prisma ORM
- Redis (ioredis) — cache com TTL
- JWT (Passport-JWT)
- Swagger (OpenAPI)
- Jest + Supertest (E2E) e `smoke.ps1`
- Pino (logs estruturados) + `X-Request-Id`
- prom-client (métricas Prometheus)
- Docker + Docker Compose
- GitHub Actions (CI)

### Providers de clima
- Padrão: Open‑Meteo (sem chave, já funciona out-of-the-box)
- Opcional: OpenWeather (defina `OPENWEATHER_API_KEY` no `.env`)

## Roadmap
Consulte o arquivo `base.md` para o escopo e o roadmap completo.

## Setup rápido

1) Clonar e instalar dependências
```
git clone https://github.com/rodri-oliveira/rota-clima-api-NestJs.git
cd rota-clima-api-NestJs/api-clima-transporte
npm i
```

2) Variáveis de ambiente
- Copie `.env.example` para `.env` e ajuste:
  - `DATABASE_URL` (Postgres)
  - `JWT_SECRET`
  - `OPENWEATHER_API_KEY` (opcional; sem a chave usa fallback mock com cache)
  - `ORS_API_KEY` (opcional; sem a chave usa fallback mock com cache)

3) Banco de dados
```
npx prisma migrate deploy
npx prisma generate
```

4) Rodar em desenvolvimento
```
npm run start:dev
```

5) Testes (E2E)
```
npm run test:e2e
```

## Documentação (Swagger)
Acesse `http://localhost:3000/docs` após subir a API. Clique em "Authorize" e use o token JWT obtido em `/auth/login`.

## Endpoints principais

### Autenticação
- `POST /auth/register`
```
{
  "email": "user@exemplo.com",
  "senha": "minhasenha",
  "nome": "Usuário"
}
```

- `POST /auth/login`
```
{
  "email": "user@exemplo.com",
  "senha": "minhasenha"
}
```
Resposta:
```
{ "access_token": "<JWT>" }
```

### Rota (com clima)
- `GET /rota?origem=SP&destino=RJ&modo=DRIVING`
Responde:
```
{
  "origem": "SP",
  "destino": "RJ",
  "modo": "DRIVING",
  "distanciaMetros": 431245,
  "duracaoSegundos": 18600,
  "clima": { "temperaturaC": 27.3, "resumo": "céu limpo" }
}
```
Observações:
- Se autenticado (Bearer), grava no histórico do usuário.
- Se `OPENWEATHER_API_KEY`/`ORS_API_KEY` não estiverem setadas ou a chamada externa falhar, usa fallback mock com cache.

### Favoritos (protegido por JWT)
- `POST /favoritos`
```
{
  "origem": "São Paulo",
  "destino": "Rio de Janeiro",
  "modo": "DRIVING",
  "apelido": "SP-RJ"
}
```
- `GET /favoritos`

### Histórico (protegido por JWT)
- `GET /historico`
Lista as últimas consultas de rota do usuário (ordenadas por mais recentes).

## Logs e boas práticas
- Filtro global de exceções e `ValidationPipe` ativo.
- Interceptor de logging (método, URL, status, duração).
- Nomenclatura de métodos e variáveis em inglês; domínio/DB podem permanecer em PT-BR conforme schema.

## Observabilidade e deploy (próximos passos)
- `/metrics` (Prometheus) e dashboards.
- Dockerfile e ajustes no `docker-compose.yml` para API + Postgres (+ Redis).

## Produção — Checklist rápido
- __Variáveis obrigatórias__
  - `DATABASE_URL` — conexão Postgres
  - `REDIS_URL` — ex.: `redis://redis:6379`
  - `JWT_SECRET` — segredo JWT
  - `CORS_ORIGIN` — origens permitidas (ex.: `https://app.meudominio.com`)
  - `RATE_LIMIT_MAX` — limite de req/15m por IP (ex.: `100`)
  - `LOG_LEVEL` — `info`/`warn`/`error` (prod)
  - `OPENWEATHER_API_KEY` (opcional) — se definido, usa OpenWeather; caso contrário, Open‑Meteo

- __Build e migrações__
  - `npm run build` (ou imagem Docker)
  - `npx prisma migrate deploy` (em release)

- __Observabilidade__
  - `/metrics` expõe métricas de HTTP e de cache (`cache_hits_total`, `cache_misses_total`)
  - Logs JSON (Pino) com `X-Request-Id` para correlação

- __Validação (smoke)__
  - Na raiz: `./smoke.ps1 -Port 3001` (ou porta configurada)


