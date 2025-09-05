# 🌍 API Clima + Transporte

## 📌 Descrição
Projeto backend desenvolvido em **Node.js** para consolidar informações de **transporte** e **clima** em uma única API.  
O usuário pode consultar uma rota entre dois pontos e obter:
- Tempo estimado de viagem
- Distância
- Condições climáticas previstas no destino
- Histórico de consultas
- Rotas favoritas

Esse projeto foi desenvolvido com foco em **boas práticas de arquitetura, testes, observabilidade e deploy em nuvem**.

---

## 🚀 Tecnologias
- **Node.js (Express ou Fastify)**
- **Axios** (requisições HTTP)
- **MongoDB ou Postgres** (persistência)
- **Redis** (cache)
- **JWT** (autenticação)
- **Swagger / OpenAPI** (documentação de rotas)
- **Jest + Supertest** (testes automatizados)
- **Docker + Docker Compose**
- **Winston ou Pino** (logs estruturados)
- **Prometheus / OpenTelemetry** (observabilidade)

---

## 🏗️ Arquitetura
- **API Gateway** → recebe requisições REST
- **Microserviço Transporte** → integra com API de transporte (ex: Google Directions API)
- **Microserviço Clima** → integra com API de clima (ex: OpenWeatherMap)
- **Banco de Dados** → armazena histórico e favoritos
- **Redis** → cache de consultas recentes
- **Error Handler** → camada dedicada para tratamento de erros
- **Observabilidade** → logs + métricas expostas no endpoint `/metrics`

---

## 📚 Endpoints (mínimos)

### Autenticação
- `POST /login` → retorna JWT  
- `POST /register` → cria usuário  

### Rotas
- `GET /rota?origem=SP&destino=RJ&modo=driving`  
  → retorna rota + clima  

- `GET /historico`  
  → histórico do usuário  

- `POST /favoritos`  
  → salva rota favorita  

- `GET /favoritos`  
  → lista favoritos  

---

## ✅ Roadmap de Desenvolvimento

- [ ] **Planejamento e Documentação Inicial**
  - Criar README e esqueleto Swagger
- [ ] **Setup do Projeto**
  - Estrutura de pastas
  - ESLint + Prettier
  - Endpoint `/health`
- [ ] **Testes Iniciais**
  - Configuração Jest + Supertest
  - Coverage report
- [ ] **Camada de Erros e Logs**
  - Middleware de erros
  - Logs estruturados
- [ ] **Funcionalidade Principal**
  - Serviço Transporte
  - Serviço Clima
  - Endpoint `/rota`
- [ ] **Banco de Dados + Cache**
  - Repository pattern
  - Histórico no banco
  - Cache Redis
- [ ] **Autenticação e Favoritos**
  - JWT
  - Endpoints `/favoritos`
- [ ] **Observabilidade**
  - Métricas (Prometheus/OpenTelemetry)
  - Logs de requisições com tempo de resposta
- [ ] **Documentação Completa**
  - Swagger atualizado
  - README com instruções
- [ ] **Deploy**
  - Dockerfile + docker-compose
  - Deploy em plataforma gratuita (Render / Railway / Fly.io)

---

## 🔒 Requisitos Não Funcionais
- Tratamento robusto de erros
- Testes automatizados sem mocks (ex.: usando Testcontainers)
- Documentação viva (Swagger)
- Deploy gratuito acessível online
- CI/CD (opcional: GitHub Actions para testes e build)

---

## 🎯 Objetivo do Projeto
Demonstrar habilidades práticas de backend, com:
- Arquitetura em microserviços
- Padrões de projeto (Facade, Repository, Service Layer)
- Testes automatizados e cobertura
- Deploy com Docker
- Observabilidade (logs + métricas)

---

✍️ **Autor**: [Seu Nome Aqui]  
📅 **Status**: Em desenvolvimento
