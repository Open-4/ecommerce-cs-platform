import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema/index.ts",
  out: "./src/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER ?? "ecs",
    password: process.env.DB_PASSWORD ?? "ecs_dev_password",
    database: process.env.DB_NAME ?? "ecs_platform",
  },
});
