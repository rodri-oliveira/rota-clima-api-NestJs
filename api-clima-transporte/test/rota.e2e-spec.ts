import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

function uniqueEmail() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `rota_${suffix}@teste.com`;
}

describe('Rota (e2e)', () => {
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

  it('GET /rota deve retornar 200 com parâmetros válidos', async () => {
    const res = await request(server)
      .get('/rota')
      .query({ origem: 'SP', destino: 'RJ', modo: 'DRIVING' })
      .expect(200);

    expect(res.body).toHaveProperty('distanciaMetros');
    expect(res.body).toHaveProperty('duracaoSegundos');
    expect(res.body).toHaveProperty('clima');
  });

  it('GET /rota sem parâmetros suficientes deve falhar com 400', async () => {
    await request(server)
      .get('/rota')
      .query({ origem: 'SP', modo: 'DRIVING' })
      .expect(400);
  });

  it('GET /rota autenticado salva histórico', async () => {
    const email = uniqueEmail();
    const senha = 'senha123';

    await request(server)
      .post('/auth/register')
      .send({ email, senha, nome: 'Usuário Rota' })
      .expect(201);

    const login = await request(server)
      .post('/auth/login')
      .send({ email, senha })
      .expect(200);

    const token = login.body.access_token as string;

    await request(server)
      .get('/rota')
      .set('Authorization', `Bearer ${token}`)
      .query({ origem: 'SP', destino: 'RJ', modo: 'WALKING' })
      .expect(200);

    const hist = await request(server)
      .get('/historico')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(hist.body)).toBe(true);
    expect(hist.body.length).toBeGreaterThanOrEqual(1);
  });
});
