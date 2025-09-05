import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

function uniqueEmail() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `e2e_${suffix}@teste.com`;
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register deve cadastrar e retornar dados públicos', async () => {
    const email = uniqueEmail();
    const res = await request(server)
      .post('/auth/register')
      .send({ email, senha: 'segredo123', nome: 'Teste E2E' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toMatchObject({ email, nome: 'Teste E2E' });
  });

  it('POST /auth/login deve retornar access_token', async () => {
    const email = uniqueEmail();
    // registra primeiro
    await request(server)
      .post('/auth/register')
      .send({ email, senha: 'segredo123', nome: 'Teste E2E' })
      .expect(201);

    const res = await request(server)
      .post('/auth/login')
      .send({ email, senha: 'segredo123' })
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.access_token).toBe('string');
  });

  it('POST /auth/register com email duplicado deve falhar com 400', async () => {
    const email = uniqueEmail();

    await request(server)
      .post('/auth/register')
      .send({ email, senha: 'segredo123', nome: 'Primeiro' })
      .expect(201);

    const res = await request(server)
      .post('/auth/register')
      .send({ email, senha: 'segredo123', nome: 'Segundo' })
      .expect(400);

    expect(res.body).toHaveProperty('statusCode', 400);
  });

  it('POST /auth/login com senha incorreta deve falhar com 401', async () => {
    const email = uniqueEmail();
    await request(server)
      .post('/auth/register')
      .send({ email, senha: 'correta123', nome: 'Teste' })
      .expect(201);

    const res = await request(server)
      .post('/auth/login')
      .send({ email, senha: 'errada123' })
      .expect(401);

    expect(res.body).toHaveProperty('statusCode', 401);
  });
});
