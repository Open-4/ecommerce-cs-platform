// @ts-nocheck
import "reflect-metadata";
import moduleAlias from "module-alias";
moduleAlias.addAliases({
  "@ecs/shared": __dirname + "/../lib/shared/src/index",
  "@ecs/core": __dirname + "/../lib/core/src/index",
  "@ecs/llm-gateway": __dirname + "/../lib/llm-gateway/src/index",
  "@ecs/base-adapter": __dirname + "/../lib/adapters/base-adapter/src/index",
});
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  });

  // 全局前缀
  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT ?? 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 API server running on http://localhost:${port}/api/v1`);
}

bootstrap();
