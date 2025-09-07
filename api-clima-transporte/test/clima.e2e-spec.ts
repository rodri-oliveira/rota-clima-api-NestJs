import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Clima (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /clima com cidade válida deve retornar clima atual', async () => {
    const res = await request(app.getHttpServer())
      .get('/clima')
      .query({ cidade: 'Rio de Janeiro' })
      .expect(200);

    expect(res.body).toHaveProperty('temperaturaC');
    expect(res.body).toHaveProperty('climaResumo');
  });

  it('GET /clima com cidade inválida deve retornar mock (fallback) e status 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/clima')
      .query({ cidade: 'CidadeInexistenteXYZ' })
      .expect(200);

    expect(res.body).toHaveProperty('temperaturaC');
    expect(res.body).toHaveProperty('climaResumo');
  });
});
