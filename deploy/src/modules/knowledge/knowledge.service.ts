import { Injectable, Inject } from "@nestjs/common";
import { eq, like, and, count, desc, sql } from "drizzle-orm";
import type { DbClient } from "../../database/connection";
import { schema } from "../../database/schema/index";

@Injectable()
export class KnowledgeService {
  constructor(@Inject("DB") private readonly db: DbClient) {}

  /** 获取知识库列表 */
  async listEntries(
    shopId: string,
    options?: {
      category?: string;
      keyword?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const conditions = [
      eq(schema.knowledgeEntries.shopId, shopId),
      eq(schema.knowledgeEntries.isActive, true),
    ];

    if (options?.category) {
      conditions.push(
        eq(schema.knowledgeEntries.category, options.category as never),
      );
    }

    if (options?.keyword) {
      conditions.push(
        sql`(${schema.knowledgeEntries.question} ILIKE ${`%${options.keyword}%`}
             OR ${schema.knowledgeEntries.answer} ILIKE ${`%${options.keyword}%`})`,
      );
    }

    const [countResult] = await this.db
      .select({ count: count() })
      .from(schema.knowledgeEntries)
      .where(and(...conditions));

    const entries = await this.db
      .select()
      .from(schema.knowledgeEntries)
      .where(and(...conditions))
      .orderBy(desc(schema.knowledgeEntries.usageCount))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      entries,
      total: countResult?.count ?? 0,
      page,
      pageSize,
    };
  }

  /** 创建知识库条目 */
  async createEntry(data: {
    shopId: string;
    category: string;
    question?: string;
    answer: string;
    source?: string;
  }) {
    const [entry] = await this.db
      .insert(schema.knowledgeEntries)
      .values({
        shopId: data.shopId,
        category: data.category as never,
        question: data.question,
        answer: data.answer,
        source: data.source ?? "manual",
      })
      .returning();

    return entry;
  }

  /** 批量导入知识库 */
  async bulkImport(
    shopId: string,
    entries: Array<{
      category: string;
      question?: string;
      answer: string;
      source?: string;
    }>,
  ) {
    const values = entries.map((e) => ({
      shopId,
      category: e.category as never,
      question: e.question,
      answer: e.answer,
      source: e.source ?? "manual",
    }));

    const results = await this.db
      .insert(schema.knowledgeEntries)
      .values(values)
      .returning();

    return { imported: results.length };
  }

  /** 更新知识库条目 */
  async updateEntry(
    id: string,
    data: {
      category?: string;
      question?: string;
      answer?: string;
      isActive?: boolean;
    },
  ) {
    const [updated] = await this.db
      .update(schema.knowledgeEntries)
      .set({
        ...data,
        category: data.category as never,
        updatedAt: new Date(),
      })
      .where(eq(schema.knowledgeEntries.id, id))
      .returning();

    return updated;
  }

  /** 删除知识库条目（软删除） */
  async deleteEntry(id: string) {
    await this.db
      .update(schema.knowledgeEntries)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.knowledgeEntries.id, id));

    return { success: true };
  }

  /** 增加引用计数 */
  async incrementUsage(id: string) {
    await this.db
      .update(schema.knowledgeEntries)
      .set({ usageCount: sql`${schema.knowledgeEntries.usageCount} + 1` })
      .where(eq(schema.knowledgeEntries.id, id));
  }

  /** 获取知识的分类统计 */
  async getCategoryStats(shopId: string) {
    const results = await this.db
      .select({
        category: schema.knowledgeEntries.category,
        count: count(),
        totalUsage: sql<number>`sum(${schema.knowledgeEntries.usageCount})`,
      })
      .from(schema.knowledgeEntries)
      .where(
        and(
          eq(schema.knowledgeEntries.shopId, shopId),
          eq(schema.knowledgeEntries.isActive, true),
        ),
      )
      .groupBy(schema.knowledgeEntries.category);

    return results;
  }

  /** 从对话中提取优秀回复，转为知识 */
  async extractFromMessage(
    messageId: string,
    shopId: string,
    category: string,
    question: string,
  ) {
    const [message] = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, messageId));

    if (!message) return null;

    return this.createEntry({
      shopId,
      category,
      question,
      answer: message.content,
      source: "conversation",
    });
  }
}
