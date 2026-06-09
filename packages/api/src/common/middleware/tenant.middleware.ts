import { Injectable, NestMiddleware } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * 多租户中间件
 * 从 JWT 中提取 merchantId，注入到 request 上下文
 * 确保每个商家只能访问自己的数据
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: FastifyRequest["raw"], res: FastifyReply["raw"], next: () => void) {
    const request = req as any;
    const user = request.user;

    if (user && user.sub) {
      // 将 merchantId 挂载到请求上下文
      request.merchantId = user.sub;
    }

    next();
  }
}
