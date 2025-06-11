import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import createDatabaseIfNotExists from './utils/database-utils/dbscript';

async function bootstrap() {
  console.log('Starting bootstrap function');

  const app = await NestFactory.create(AppModule);

  const config = app.get<ConfigService>(ConfigService);

  await createDatabaseIfNotExists(config);

  const options = new DocumentBuilder()
    .setTitle(config.get('npm_package_name') || 'proyect')
    .addTag('Health', 'Help endpoints')
    .setVersion(config.get('npm_package_version') || '0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api', app, document);

  app.enableShutdownHooks();

  const port = config.get<number>('APP_PORT') || 3000;

  await app.listen(port, () =>
    console.info(
      `service ${config.get('npm_package_name')} is listening on port ${port}, in the environment ${config.get('NODE_ENV')} 🚀`,
      'AppStart',
    ),
  );
}
bootstrap();
