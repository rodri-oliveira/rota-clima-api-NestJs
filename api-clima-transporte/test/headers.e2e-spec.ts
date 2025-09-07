import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

describe('Headers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // No ambiente de teste, o bootstrap (main.ts) não roda. Registramos o interceptor aqui.
    app.useGlobalInterceptors(new LoggingInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('X-Request-Id deve estar presente no header da resposta (ex.: /health)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers).toHaveProperty('x-request-id');
    expect(typeof res.headers['x-request-id']).toBe('string');
    expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
  });
});
