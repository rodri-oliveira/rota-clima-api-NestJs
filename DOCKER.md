# Docker Guide — API Clima + Transporte

Este guia explica, de forma didática, como rodar a stack completa (API + Postgres + Redis) com Docker/Docker Compose, além de como alternar entre rodar a API localmente ou em container.

## Visão Geral
- Arquivo de orquestração: `docker-compose.yml` (na raiz)
- Dockerfile da API: `api-clima-transporte/Dockerfile`
- Prisma Schema: `api-clima-transporte/prisma/schema.prisma`
- Variáveis de ambiente da API: `api-clima-transporte/.env`

Serviços padronizados:
- `api` — API NestJS, exposta em `http://localhost:3001`
- `postgres` — Postgres 16, porta do host `5433` → container `5432`
- `redis` — Redis 7, porta do host `6379` → container `6379`

## Pré-requisitos
- Windows 10/11
- WSL2 habilitado
- Docker Desktop instalado (engine WSL2)

## Quando usar Docker?
- Para rodar banco/cache de forma isolada e reprodutível.
- Para subir toda a stack com um único comando.
- Para testar a imagem final (deploy-like). 

Para desenvolvimento do dia a dia, você pode rodar a API com `npm run start:dev` (fora do Docker) e usar somente Postgres/Redis no Docker.

---

## Variáveis de Ambiente
Arquivo: `api-clima-transporte/.env`

- API fora do Docker (conectando ao Postgres em Docker Compose):
```
DATABASE_URL="postgresql://app:app@localhost:5433/rota_clima?schema=public"
PORT=3000
REDIS_URL="redis://localhost:6379"
```

> Observação: porta 5433 no host mapeia para 5432 no container do Postgres.

- API em container (Compose injeta automaticamente no serviço `api`):
```
DATABASE_URL="postgresql://app:app@postgres:5432/rota_clima?schema=public"
```

> O Compose sobrescreve `DATABASE_URL` do `.env` ao rodar o serviço `api`, apontando para `postgres:5432` (nome do serviço na rede do Compose).

---

## Subir toda a stack com Docker Compose
Diretório: raiz do repositório

1) Build e subir serviços:
```
docker compose up -d --build
```
2) Ver status:
```
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```
3) Logs da API:
```
docker logs -f rota_clima_api
```
4) Testar endpoints:
- Health:  http://localhost:3001/health
- Swagger: http://localhost:3001/docs
- Métricas: http://localhost:3001/metrics

5) Parar tudo:
```
docker compose down
```

---

## Rodar somente banco e cache com Docker
Diretório: raiz do repositório
```
docker compose up -d postgres redis
```
Agora, rode a API localmente (fora do Docker):

Diretório: raiz do repositório
```
npm --prefix api-clima-transporte run start:dev
```
Ou, dentro de `api-clima-transporte/`:
```
npm run start:dev
```

Endpoints (API local):
- http://localhost:3000/health
- http://localhost:3000/docs
- http://localhost:3000/metrics

---

## Prisma — Migrations e Client
- Primeiro ajuste o `DATABASE_URL` no `.env` conforme o cenário.
- Em seguida, rode (dentro de `api-clima-transporte/`):
```
npx prisma migrate deploy
npx prisma generate
```

> Em Docker, o `Dockerfile` já roda `npx prisma generate` no build para embutir engines compatíveis (Debian OpenSSL 3) na imagem.

### Compatibilidade de binários do Prisma
Arquivo: `api-clima-transporte/prisma/schema.prisma`
```
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```
- `native` — desenvolvimento local (Windows)
- `debian-openssl-3.0.x` — imagem Docker baseada em Debian (bookworm-slim)

Se mudar a base da imagem, ajuste `binaryTargets` conforme a distro/openssl.

---

## Portas e conflitos
- API em container usa `3001:3000` (host:container). 
- Se `3001` estiver em uso, altere em `docker-compose.yml`:
```
services:
  api:
    ports:
      - "<porta_host>:3000"
```

> Ex.: `"3002:3000"` e acesse `http://localhost:3002`.

---

## Fluxo recomendado (desenvolvimento)
- Suba Postgres e Redis com Compose:
```
docker compose up -d postgres redis
```
- Garanta migrações/client Prisma:
```
# dentro de api-clima-transporte/
npx prisma migrate deploy
npx prisma generate
```
- Rode a API localmente:
```
# raiz
npm --prefix api-clima-transporte run start:dev
```

Quando quiser testar “como produção”, suba também a API no Compose:
```
# raiz
docker compose up -d --build
```

---

## Troubleshooting

- Porta ocupada (API):
  - Erro: `ports are not available: ... 0.0.0.0:3000` (ou 3001)
  - Solução A: libere a porta (finalize o processo que está usando).
  - Solução B: mude a porta do host no `docker-compose.yml`.

- Prisma — engines não encontrados:
  - Causa: `binaryTargets` incompatível com a imagem ou engines não gerados.
  - Solução: ajustar `binaryTargets` no `schema.prisma` e assegurar `npx prisma generate` no build (Dockerfile).

- Prisma — OpenSSL 1.1 / Alpine:
  - Causa: Alpine precisa de `libssl1.1` em engines antigos.
  - Solução: mudamos a imagem para Debian (OpenSSL 3) e `binaryTargets = ["native","debian-openssl-3.0.x"]`.

- Postgres não está `healthy`:
  - Verifique logs: `docker logs -f rota_clima_postgres`
  - Aguarde o healthcheck ficar `healthy` antes da API iniciar com sucesso.

- Métricas `/metrics` sem dados além dos padrões:
  - Instale `prom-client` (já instalado): `npm --prefix api-clima-transporte i prom-client`
  - Para métricas HTTP por rota, adicionar um interceptor (futuro passo).

---

## Cache Redis (GET /rota)
O endpoint `GET /rota` agora possui cache em Redis para reduzir latência e chamadas externas.

Diretório do serviço: `api-clima-transporte/src/common/cache/redis-cache.service.ts`

- __Como funciona__
  - Chave do cache: `origem|destino|modo` com prefixo configurável (`ROUTE_CACHE_PREFIX`).
  - TTL padrão: 600s (`ROUTE_CACHE_TTL_SECONDS`).
  - O compose define automaticamente `REDIS_URL` para os containers (`redis://redis:6379`).

- __Variáveis__ (arquivo `api-clima-transporte/.env` — opcionais quando fora do Docker):
  - `REDIS_URL="redis://localhost:6379"`
  - `ROUTE_CACHE_TTL_SECONDS=600`
  - `ROUTE_CACHE_PREFIX=rota_cache:`

- __Testar__
  1. Suba a stack (prod-like): `docker compose up -d postgres redis api`
  2. Faça duas requisições idênticas no Swagger a `GET /rota` (mesma origem/destino/modo)
  3. A segunda deverá responder mais rápido (hit no cache)

- __Observações__
  - Em desenvolvimento (profile `dev`), o `api-dev` também usa `REDIS_URL=redis://redis:6379`.
  - Para invalidar o cache manualmente, basta alterar `origem/destino/modo` ou mudar o `PREFIX`/`TTL`.

---

## Microserviços: boas práticas (resumo)
- 1 serviço (container) por microserviço.
- Dependências (DB, cache, mensageria) em containers próprios.
- Healthchecks, logs estruturados, métricas, e variáveis por ambiente.
- Em dev: Compose; em produção: orquestrador (Kubernetes) é o caminho natural.

---

## Comandos úteis
- Subir tudo (build):
```
docker compose up -d --build
```
- Parar tudo:
```
docker compose down
```
- Reiniciar somente a API:
```
docker compose restart api
```
- Ver status com portas:
```
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```
- Logs:
```
docker logs -f rota_clima_api
```
- Remover volumes (atenção: apaga dados!):
```
docker compose down -v
```

---

## Onde editar o que
- Compose: `docker-compose.yml`
- Dockerfile da API: `api-clima-transporte/Dockerfile`
- Variáveis de ambiente: `api-clima-transporte/.env`
- Prisma schema: `api-clima-transporte/prisma/schema.prisma`

Se quiser, posso adicionar um profile `dev` no Compose para hot‑reload (montando o código como volume e rodando `npm run start:dev` dentro do container).

---

## Passo a passo rápido (com diretórios)

- __Produção local (porta 3001)__ — Diretório: raiz do repositório
  1. Subir serviços:
     ```powershell
     docker compose up -d postgres redis api
     ```
  2. Testar:
     - Swagger: http://localhost:3001/docs
     - Health: http://localhost:3001/health
     - Métricas: http://localhost:3001/metrics
  3. Cache /rota: faça duas chamadas idênticas a `GET /rota` no Swagger; a segunda deve ser mais rápida (Redis).

- __Desenvolvimento (porta 3002)__ — Diretório: raiz do repositório
  1. Subir dev (hot‑reload):
     ```powershell
     docker compose --profile dev up -d api-dev
     ```
  2. Testar:
     - Swagger: http://localhost:3002/docs
     - Health: http://localhost:3002/health
     - Métricas: http://localhost:3002/metrics

- __API fora do Docker (porta 3000)__
  1. Diretório: raiz
     ```powershell
     docker compose up -d postgres redis
     ```
  2. Diretório: `api-clima-transporte/`
     ```powershell
     npm run start:dev
     ```
  3. Testar:
     - Swagger: http://localhost:3000/docs
     - Health: http://localhost:3000/health
     - Métricas: http://localhost:3000/metrics
