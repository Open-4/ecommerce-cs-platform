// @ts-nocheck
import { Controller, Get, Post, Put, Body, UseGuards, Request, Param } from "@nestjs/common";
import { MerchantService } from "./merchant.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("merchant")
@UseGuards(JwtAuthGuard)
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get("profile")
  async profile(@Request() req: any) {
    return this.merchantService.getProfile(req.user.sub);
  }

  @Get("shops")
  async shops(@Request() req: any) {
    return this.merchantService.listShops(req.user.sub);
  }

  /** 手动添加店铺（填入API Key） */
  @Post("shops")
  async addShop(
    @Request() req: any,
    @Body() body: {
      platform: string;
      shopName: string;
      appKey?: string;
      appSecret?: string;
      accessToken?: string;
    },
  ) {
    return this.merchantService.addShop({
      merchantId: req.user.sub,
      platform: body.platform,
      shopName: body.shopName,
      appKey: body.appKey,
      appSecret: body.appSecret,
      accessToken: body.accessToken,
    });
  }

  /** 更新店铺 API 配置 */
  @Put("shops/:id")
  async updateShop(
    @Request() req: any,
    @Param("id") shopId: string,
    @Body() body: {
      appKey?: string;
      appSecret?: string;
      accessToken?: string;
      shopName?: string;
    },
  ) {
    return this.merchantService.updateShop(shopId, req.user.sub, body);
  }

  /** 获取平台接入指南 */
  @Get("platform-guide/:platform")
  async platformGuide(@Param("platform") platform: string) {
    return this.getPlatformGuide(platform);
  }

  private getPlatformGuide(platform: string) {
    const guides: Record<string, any> = {
      taobao: {
        name: "淘宝/天猫",
        steps: [
          { title: "注册开放平台", desc: "访问 open.taobao.com 注册开发者账号" },
          { title: "创建应用", desc: "创建「商家应用」，获取 AppKey 和 AppSecret" },
          { title: "配置回调地址", desc: "设置 OAuth 回调地址为: https://你的域名/api/v1/webhook/taobao/message" },
          { title: "获取授权", desc: "使用 AppKey 和 AppSecret 完成 OAuth 授权流程" },
        ],
        docUrl: "https://open.taobao.com/",
        apiFields: ["appKey", "appSecret"],
      },
      douyin: {
        name: "抖音电商",
        steps: [
          { title: "注册开放平台", desc: "访问 open.douyin.com 注册开发者" },
          { title: "创建应用", desc: "创建「商家应用」获取应用凭证" },
          { title: "配置回调地址", desc: "设置消息回调地址为: https://你的域名/api/v1/webhook/douyin/message" },
          { title: "完成授权", desc: "在抖音商家后台完成应用授权" },
        ],
        docUrl: "https://open.douyin.com/",
        apiFields: ["appKey", "appSecret"],
      },
    };
    return guides[platform] ?? { error: "不支持的平台" };
  }
}
