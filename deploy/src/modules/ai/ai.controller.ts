import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AiService } from "./ai.service.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** 手动触发 AI 处理某条消息 */
  @Post("process")
  @HttpCode(HttpStatus.OK)
  async processMessage(
    @Body()
    body: {
      conversationId: string;
      message: string;
      shopId: string;
    },
  ) {
    return this.aiService.processIncomingMessage(
      body.conversationId,
      body.message,
      body.shopId,
    );
  }

  /** 退款决策评估 */
  @Post("refund-decision")
  @HttpCode(HttpStatus.OK)
  async refundDecision(
    @Body()
    body: {
      shopId: string;
      conversationId: string;
      orderAmount: number;
      refundAmount: number;
      refundReason: string;
      refundDescription: string;
      shippingStatus: string;
      daysAfterDelivery: number;
      buyerOrderCount: number;
      buyerReturnRate: number;
      hasDispute: boolean;
      category: string;
      categoryReturnRate: number;
      sentiment: string;
      conversationQuality: number;
    },
  ) {
    return this.aiService.processRefundDecision(
      body.shopId,
      body.conversationId,
      body,
    );
  }

  /** 获取 AI 调用成本统计 */
  @Post("cost-stats")
  @HttpCode(HttpStatus.OK)
  async costStats() {
    // TODO: 从 CostTracker 获取真实统计
    return {
      today: {
        totalCost: 2.35,
        totalCalls: 842,
        avgLatencyMs: 380,
        models: {
          "claude-haiku-4-5": { calls: 520, cost: 0.42 },
          "claude-sonnet-4-6": { calls: 322, cost: 1.93 },
        },
      },
      thisMonth: {
        totalCost: 48.75,
        totalCalls: 18420,
      },
    };
  }
}
