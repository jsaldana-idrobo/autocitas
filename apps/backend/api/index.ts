import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { AppModule } from "../src/app.module.js";

type ExpressHandler = (req: VercelRequest, res: VercelResponse) => void;

let cachedServer: ExpressHandler | null = null;

async function bootstrap(): Promise<ExpressHandler> {
  const server = express();
  server.disable("x-powered-by");
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
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "/", method: RequestMethod.GET },
      { path: "health", method: RequestMethod.GET }
    ]
  });
  await app.init();
  return server as unknown as ExpressHandler;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}
