import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { AppModule } from "../src/app.module";

type ExpressHandler = (req: VercelRequest, res: VercelResponse) => void;

let cachedServer: ExpressHandler | null = null;

async function bootstrap(): Promise<ExpressHandler> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
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
  app.setGlobalPrefix("api");
  await app.init();
  return server as unknown as ExpressHandler;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}
