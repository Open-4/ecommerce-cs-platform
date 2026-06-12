// @ts-nocheck
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

/** 创建数据库连接 */
export function createDb(databaseUrl?: string) {
  const url =
    databaseUrl ??
    `postgres://${process.env.DB_USER ?? "ecs"}:${process.env.DB_PASSWORD ?? "ecs_dev_password"}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? "5432"}/${process.env.DB_NAME ?? "ecs_platform"}`;

  const client = postgres(url, { max: 20 });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
export { schema };
