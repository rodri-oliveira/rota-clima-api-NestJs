# 🌍 API Clima + Transporte

Backend em NestJS com PostgreSQL (Prisma) para consultar rotas e clima, com histórico e favoritos.

## Objetivo
Consolidar informações de transporte e clima em uma única API com boas práticas: testes, logs, observabilidade e deploy.

## Tecnologias
- NestJS (Fastify)
- PostgreSQL + Prisma
- Redis (cache)
- JWT (autenticação)
- Swagger (documentação)
- Jest + Supertest (testes)
- Docker + Docker Compose
- Pino (logs)
- Prometheus / OpenTelemetry (observabilidade)

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

