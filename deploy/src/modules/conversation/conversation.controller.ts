import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ConversationService } from "./conversation.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
  ) {}

  @Get()
  async list(
    @Request() req: any,
    @Query("shopId") shopId: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
    @Query("keyword") keyword?: string,
  ) {
    return this.conversationService.listConversations(shopId, {
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      keyword,
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.conversationService.getConversation(id);
  }

  @Post(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
  ) {
    return this.conversationService.updateStatus(id, body.status as never);
  }

  @Post(":id/read")
  async markRead(@Param("id") id: string) {
    await this.conversationService.markAsRead(id);
    return { success: true };
  }

  @Post(":id/assign")
  async assign(
    @Param("id") id: string,
    @Body() body: { userId: string },
  ) {
    await this.conversationService.assignTo(id, body.userId);
    return { success: true };
  }
}
