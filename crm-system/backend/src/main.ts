import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // מאפשר גישה מהדפדפן (CORS) - חשוב לשלב הבא
  app.enableCors();

  // הגדרת Swagger
  const config = new DocumentBuilder()
    .setTitle('CRM System')
    .setDescription('מערכת לניהול תיקי לקוחות')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();