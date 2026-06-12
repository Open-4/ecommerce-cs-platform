// @ts-nocheck
import { Module, Global, OnModuleDestroy } from "@nestjs/common";
import { createDb } from "./connection";
import type { DbClient } from "./connection";

@Global()
@Module({
  providers: [
    {
      provide: "DB",
      useFactory: (): DbClient => {
        return createDb();
      },
    },
  ],
  exports: ["DB"],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy() {
    // 清理数据库连接
  }
}
