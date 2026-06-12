// @ts-nocheck
import { Module } from "@nestjs/common";
import { WebhookController } from "./webhook.controller";
import { ConversationModule } from "../conversation/conversation.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [ConversationModule, AiModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
