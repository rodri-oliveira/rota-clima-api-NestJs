import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

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

  // Interceptor de logging (método, URL, status, duração)
  app.useGlobalInterceptors(new LoggingInterceptor());

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
