import { Controller, Get, Post, Body, UseGuards, Request, Param } from "@nestjs/common";
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

  @Post("shops")
  async addShop(
    @Request() req: any,
    @Body() body: { platform: string; platformShopId: string; shopName: string },
  ) {
    return this.merchantService.addShop({
      merchantId: req.user.sub,
      ...body,
    });
  }
}
