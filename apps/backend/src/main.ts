import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "/", method: RequestMethod.GET },
      { path: "health", method: RequestMethod.GET }
    ]
  });
  await app.listen(3000);
}

bootstrap();
