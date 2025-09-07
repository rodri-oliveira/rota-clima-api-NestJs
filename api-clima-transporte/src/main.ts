import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Filtro global de erros padronizados
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation global para DTOs (boas práticas)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global interceptor for Prometheus HTTP metrics (no-op if prom-client missing)
  app.useGlobalInterceptors(new MetricsInterceptor());

  // Interceptor de logging (método, URL, status, duração)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Segurança básica (headers, CORS e rate limit)
  app.use(helmet());
  // CORS: whitelist por env; em dev liberamos tudo por simplicidade
  const originEnv = process.env.CORS_ORIGIN;
  app.use(
    cors({
      origin:
        originEnv && originEnv !== '*'
          ? originEnv.split(',').map((o) => o.trim())
          : true,
      credentials: true,
    }),
  );
  // Rate limit (~100 req / 15 min por IP); liberar health/metrics
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ['/health', '/metrics'].includes(req.path),
  });
  app.use(limiter);

  // Configuração Swagger (documentação da API)
  const config = new DocumentBuilder()
    .setTitle('API Clima + Transporte')
    .setDescription(
      'API que consolida rotas de transporte e previsão do clima, com histórico e favoritos.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
