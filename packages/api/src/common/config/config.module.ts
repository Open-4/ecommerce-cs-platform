import { Module, Global } from "@nestjs/common";

@Global()
@Module({
  providers: [
    {
      provide: "APP_CONFIG",
      useFactory: () => ({
        port: parseInt(process.env.PORT ?? "4000", 10),
        dbHost: process.env.DB_HOST ?? "localhost",
        dbPort: parseInt(process.env.DB_PORT ?? "5432", 10),
        dbUser: process.env.DB_USER ?? "ecs",
        dbPassword: process.env.DB_PASSWORD ?? "ecs_dev_password",
        dbName: process.env.DB_NAME ?? "ecs_platform",
        redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
        jwtSecret: process.env.JWT_SECRET ?? "ecs-dev-secret-change-in-prod",
        claudeApiKey: process.env.CLAUDE_API_KEY ?? "",
        openaiApiKey: process.env.OPENAI_API_KEY ?? "",
        frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
      }),
    },
  ],
  exports: ["APP_CONFIG"],
})
export class ConfigModule {}
