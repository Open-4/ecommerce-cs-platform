import { Module } from "@nestjs/common";
import { ConfigModule } from "./common/config/config.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { MerchantModule } from "./modules/merchant/merchant.module.js";
import { ConversationModule } from "./modules/conversation/conversation.module.js";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module.js";
import { OrderModule } from "./modules/order/order.module.js";
import { AnalyticsModule } from "./modules/analytics/analytics.module.js";
import { WebhookModule } from "./modules/webhook/webhook.module.js";
import { AiModule } from "./modules/ai/ai.module.js";

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
})
export class AppModule {}
