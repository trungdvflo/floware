import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * https://docs.nestjs.com/recipes/swagger
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('FLO 4.0')
    .setDescription('Convert api ruby to nodejs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 1986);
}

// tslint:disable-next-line:no-console
bootstrap().catch(console.error);
