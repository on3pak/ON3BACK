import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CustomLogger } from './common/interfaces/custom-logger.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const customLogger = app.get(CustomLogger);

  app.useLogger(customLogger);
  app.useGlobalFilters(new AllExceptionsFilter(customLogger));

  const appConfig = configService.get<any>('app');
  app.setGlobalPrefix(appConfig?.apiPrefix || 'api');

  const corsConfig = configService.get<any>('cors');
  const origins = corsConfig?.origin || ['http://localhost:5173'];
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: corsConfig?.credentials ?? true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('REST API with JWT authentication')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = appConfig?.port || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on: http://0.0.0.0:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
