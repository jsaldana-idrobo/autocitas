import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envLocal = resolve(process.cwd(), ".env.local");
const envDefault = resolve(process.cwd(), ".env");
config({ path: existsSync(envLocal) ? envLocal : envDefault });

const { AppModule } = await import("./app.module.js");
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
const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
