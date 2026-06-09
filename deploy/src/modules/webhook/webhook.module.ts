import { Module } from "@nestjs/common";
import { WebhookController } from "./webhook.controller.js";
import { ConversationModule } from "../conversation/conversation.module.js";
import { AiModule } from "../ai/ai.module.js";

@Module({
  imports: [ConversationModule, AiModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
