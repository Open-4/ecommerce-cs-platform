import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("未提供认证令牌");
    }

    try {
      const secret = process.env.JWT_SECRET ?? "ecs-dev-secret-change-in-prod";
      const payload = jwt.verify(token, secret);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("认证令牌无效或已过期");
    }
  }

  private extractToken(request: Record<string, unknown>): string | null {
    const authHeader = request.headers as Record<string, string> | undefined;
    const authorization = authHeader?.authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(" ");
    return type === "Bearer" ? (token ?? null) : null;
  }
}
