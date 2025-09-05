import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

function uniqueEmail() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `favhist_${suffix}@teste.com`;
}

async function registerAndLogin(server: any) {
  const email = uniqueEmail();
  const senha = 'senha123';
  const nome = 'E2E';

  await request(server)
    .post('/auth/register')
    .send({ email, senha, nome })
    .expect(201);

  const loginRes = await request(server)
    .post('/auth/login')
    .send({ email, senha })
    .expect(200);

  const token = loginRes.body.access_token as string;
  return { token };
}

describe('Favoritos & Histórico (e2e)', () => {
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

  it('POST /favoritos deve criar favorito e GET /favoritos deve listar', async () => {
    const { token } = await registerAndLogin(server);

    const createRes = await request(server)
      .post('/favoritos')
      .set('Authorization', `Bearer ${token}`)
      .send({ origem: 'SP', destino: 'RJ', modo: 'DRIVING', apelido: 'SP-RJ' })
      .expect(201);

    expect(createRes.body).toHaveProperty('id');

    const listRes = await request(server)
      .get('/favoritos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /favoritos duplicado deve retornar 400', async () => {
    const { token } = await registerAndLogin(server);

    await request(server)
      .post('/favoritos')
      .set('Authorization', `Bearer ${token}`)
      .send({ origem: 'A', destino: 'B', modo: 'WALKING' })
      .expect(201);

    await request(server)
      .post('/favoritos')
      .set('Authorization', `Bearer ${token}`)
      .send({ origem: 'A', destino: 'B', modo: 'WALKING' })
      .expect(400);
  });

  it('GET /historico deve responder 200 (lista - possivelmente vazia)', async () => {
    const { token } = await registerAndLogin(server);

    const res = await request(server)
      .get('/historico')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
