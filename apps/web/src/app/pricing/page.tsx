"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  MessageSquare,
  Shield,
  BarChart3,
  Users,
  Headphones,
  ArrowRight,
  Star,
} from "lucide-react";

// ============================================================
// 定价方案
// ============================================================

const PLANS = [
  {
    name: "免费试用",
    price: "0",
    period: "14天",
    description: "体验 AI 客服的核心能力",
    cta: "免费开始",
    href: "/register",
    popular: false,
    features: [
      { text: "1 个平台店铺接入", included: true },
      { text: "AI 自动回复建议", included: true },
      { text: "知识库 100 条", included: true },
      { text: "基础数据看板", included: true },
      { text: "Web 控制台", included: true },
      { text: "自动回复（发送）", included: false },
      { text: "退款风险评估", included: false },
      { text: "多平台管理", included: false },
      { text: "API 接入", included: false },
      { text: "专属客服支持", included: false },
    ],
  },
  {
    name: "标准版",
    price: "299",
    period: "/月",
    description: "适合月销 1000-5000 单的中小店铺",
    cta: "开始使用",
    href: "/register?plan=standard",
    popular: true,
    features: [
      { text: "3 个平台店铺", included: true },
      { text: "AI 自动回复 + 自动发送", included: true },
      { text: "知识库 1000 条", included: true },
      { text: "完整数据分析", included: true },
      { text: "Web + 移动端控制台", included: true },
      { text: "退款风险评估", included: true },
      { text: "智能催单/挽单", included: true },
      { text: "多平台统一管理", included: true },
      { text: "API 接入", included: false },
      { text: "客服支持（工作日）", included: true },
    ],
  },
  {
    name: "专业版",
    price: "999",
    period: "/月",
    description: "适合月销万单以上的头部商家",
    cta: "联系销售",
    href: "/register?plan=pro",
    popular: false,
    features: [
      { text: "不限平台店铺", included: true },
      { text: "AI 自动回复 + 全自动", included: true },
      { text: "不限知识库", included: true },
      { text: "高级分析 + 导出报表", included: true },
      { text: "全端控制台", included: true },
      { text: "AI 退款决策 + 自动举证", included: true },
      { text: "个性化推荐引擎", included: true },
      { text: "全平台 + 跨店铺", included: true },
      { text: "API 接入 + Webhook", included: true },
      { text: "7×24 小时专属支持", included: true },
    ],
  },
  {
    name: "企业定制",
    price: "联系我们",
    period: "",
    description: "大型品牌、ISV、私有化部署需求",
    cta: "联系销售",
    href: "mailto:sales@ecs.example.com",
    popular: false,
    features: [
      { text: "完全定制化", included: true },
      { text: "私有化部署", included: true },
      { text: "专属模型训练", included: true },
      { text: "SLA 保障 99.9%", included: true },
      { text: "源码授权", included: true },
      { text: "定制集成开发", included: true },
      { text: "专属客户成功经理", included: true },
      { text: "SSO / LDAP 集成", included: true },
      { text: "无限 API 调用", included: true },
      { text: "定制 SLA", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "免费试用需要绑定信用卡吗？",
    a: "不需要。14 天免费试用无需任何支付信息，到期后自动降级，不会产生费用。",
  },
  {
    q: "如何计费？会话量超出套餐怎么办？",
    a: "按店铺月活跃会话量计费。标准版包含 5000 次会话/月，超出部分按 ¥0.05/次 计费。专业版包含 20000 次，超出 ¥0.03/次。",
  },
  {
    q: "支持哪些电商平台？",
    a: "目前支持淘宝/天猫和抖音电商。京东、拼多多、快手电商正在开发中，已购用户升级后自动支持。",
  },
  {
    q: "数据安全吗？我的客户数据会被用于训练模型吗？",
    a: "绝对不会。您的数据加密存储，不会用于训练模型、不会分享给第三方。支持签署 NDA 保密协议，专业版以上支持私有化部署。",
  },
  {
    q: "可以随时取消吗？",
    a: "可以。按月订阅，随时取消，未使用天数按比例退款。数据可导出（支持 JSON/CSV）。",
  },
  {
    q: "AI 效果不好怎么办？",
    a: "AI 效果与知识库质量正相关。我们提供免费的入驻指导和知识库优化建议。如果持续不满意，30 天内无条件退款。",
  },
];

// ============================================================
// 主组件
// ============================================================

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ECS 智能客服中台</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              免费试用
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          简单透明的定价
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          14 天免费试用，无需信用卡。随时取消，按需升级。
        </p>

        {/* 计费周期切换 */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={`text-sm ${
              billingCycle === "monthly"
                ? "font-medium text-slate-900"
                : "text-slate-500"
            }`}
          >
            月付
          </span>
          <button
            onClick={() =>
              setBillingCycle(
                billingCycle === "monthly" ? "yearly" : "monthly",
              )
            }
            className="relative h-7 w-12 rounded-full bg-slate-200 transition-colors"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-primary shadow transition-transform ${
                billingCycle === "yearly" ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <span
            className={`text-sm ${
              billingCycle === "yearly"
                ? "font-medium text-slate-900"
                : "text-slate-500"
            }`}
          >
            年付
            <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-700">
              省 20%
            </span>
          </span>
        </div>
      </section>

      {/* Plans */}
      <section className="container pb-16">
        <div className="grid gap-6 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                plan.popular
                  ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg shadow-primary/25">
                    <Star className="h-3 w-3 fill-current" />
                    最受欢迎
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  {plan.price.startsWith("¥") || plan.price === "联系我们" ? (
                    plan.price
                  ) : billingCycle === "yearly" && plan.price !== "0" ? (
                    <>¥{Math.round(parseInt(plan.price) * 0.8)}</>
                  ) : (
                    <>¥{plan.price}</>
                  )}
                </span>
                {plan.period && (
                  <span className="text-sm text-slate-500">{plan.period}</span>
                )}
                {billingCycle === "yearly" && plan.price !== "0" && plan.price !== "联系我们" && (
                  <div className="mt-1 text-xs text-green-600">
                    年付省 ¥{Math.round(parseInt(plan.price) * 0.2 * 12)}/年
                  </div>
                )}
              </div>

              <Link
                href={plan.href}
                className={`mb-6 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                  plan.popular
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
                    : plan.name === "企业定制"
                      ? "border-2 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white"
                      : "border-2 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {plan.cta}
                {plan.popular && (
                  <ArrowRight className="ml-1 inline h-4 w-4" />
                )}
              </Link>

              <div className="flex-1 space-y-2 border-t pt-4">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2">
                    {f.included ? (
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-slate-300" />
                    )}
                    <span
                      className={`text-sm ${
                        f.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y bg-white py-12">
        <div className="container">
          <div className="grid grid-cols-4 gap-8 text-center">
            <TrustBadge
              icon={Zap}
              value="99.9%"
              label="服务可用性 SLA"
            />
            <TrustBadge
              icon={MessageSquare}
              value="50万+"
              label="日均处理消息"
            />
            <TrustBadge
              icon={Users}
              value="500+"
              label="服务商家数"
            />
            <TrustBadge
              icon={Shield}
              value="30天"
              label="不满意无条件退款"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
          常见问题
        </h2>
        <div className="mx-auto max-w-2xl divide-y">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          14 天免费试用，让 AI 帮您省下第一个客服的工资
        </h2>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-8 py-3 font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            免费开始
          </Link>
          <Link
            href="mailto:sales@ecs.example.com"
            className="rounded-lg border px-8 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            预约演示
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-slate-500">
        &copy; 2026 ECS Platform. All rights reserved.
      </footer>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer items-center justify-between font-medium text-slate-900">
        {q}
        <span className="text-slate-400 transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-2 text-sm text-slate-600">{a}</p>
    </details>
  );
}

function TrustBadge({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Zap;
  value: string;
  label: string;
}) {
  return (
    <div>
      <Icon className="mx-auto h-8 w-8 text-primary/60" />
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
