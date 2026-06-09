// ============================================================
// 商品类型
// ============================================================

import type { PlatformType } from "./platform";

/** 商品状态 */
export type ProductStatus = "on_sale" | "off_shelf" | "deleted";

/** SKU 属性 */
export interface SkuProperty {
  name: string;   // 属性名，如"颜色"
  value: string;  // 属性值，如"红色"
  imageUrl?: string;
}

/** SKU 信息 */
export interface UnifiedSku {
  skuId: string;
  platformSkuId: string;
  properties: SkuProperty[];
  price: number;         // 售价（分）
  originalPrice?: number; // 原价（分）
  stock: number;         // 库存
  barcode?: string;      // 条形码
  outerId?: string;      // 商家编码
  imageUrl?: string;
  status: ProductStatus;
}

/** 统一商品结构 */
export interface UnifiedProduct {
  productId: string;
  platform: PlatformType;
  platformProductId: string;
  title: string;
  subtitle?: string;
  mainImageUrl: string;
  images: string[];
  description: string;     // 商品详情（HTML）
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  priceRange: {
    min: number;
    max: number;
  };
  skus: UnifiedSku[];
  attributes: ProductAttribute[];
  status: ProductStatus;
  salesVolume?: number;    // 销量
  rating?: number;         // 评分
  createdAt: Date;
  updatedAt?: Date;
  rawData?: Record<string, unknown>;
}

/** 商品属性 */
export interface ProductAttribute {
  name: string;
  value: string;
  group?: string;  // 属性分组，如"规格参数"、"包装清单"
}

/** 商品查询过滤器 */
export interface ProductFilter {
  status?: ProductStatus;
  categoryId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
