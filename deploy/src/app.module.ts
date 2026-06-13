// @ts-nocheck
import { Module } from "@nestjs/common";
import { ConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import { ConversationModule } from "./modules/conversation/conversation.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { OrderModule } from "./modules/order/order.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { AiModule } from "./modules/ai/ai.module";
import { HealthController } from "./modules/health/health.controller";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MerchantModule,
    ConversationModule,
    KnowledgeModule,
    OrderModule,
    AnalyticsModule,
    WebhookModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
