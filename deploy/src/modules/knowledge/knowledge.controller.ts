import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("knowledge")
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async list(
    @Query("shopId") shopId: string,
    @Query("category") category?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ) {
    return this.knowledgeService.listEntries(shopId, {
      category,
      keyword,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post()
  async create(
    @Body()
    body: {
      shopId: string;
      category: string;
      question?: string;
      answer: string;
    },
  ) {
    return this.knowledgeService.createEntry(body);
  }

  @Post("bulk")
  async bulkImport(
    @Query("shopId") shopId: string,
    @Body()
    body: Array<{ category: string; question?: string; answer: string }>,
  ) {
    return this.knowledgeService.bulkImport(shopId, body);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      category?: string;
      question?: string;
      answer?: string;
      isActive?: boolean;
    },
  ) {
    return this.knowledgeService.updateEntry(id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.knowledgeService.deleteEntry(id);
  }

  @Get("stats")
  async stats(@Query("shopId") shopId: string) {
    return this.knowledgeService.getCategoryStats(shopId);
  }

  @Post("extract/:messageId")
  async extractFromMessage(
    @Param("messageId") messageId: string,
    @Body() body: { shopId: string; category: string; question: string },
  ) {
    return this.knowledgeService.extractFromMessage(
      messageId,
      body.shopId,
      body.category,
      body.question,
    );
  }
}
