import { Module } from "@nestjs/common";
import { AiService } from "./ai.service.js";
import { AiController } from "./ai.controller.js";
import { ConversationModule } from "../conversation/conversation.module.js";

@Module({
  imports: [ConversationModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
