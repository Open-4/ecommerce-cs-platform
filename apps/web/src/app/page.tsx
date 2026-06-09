import Link from "next/link";
import { MessageSquare, BarChart3, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ECS 智能客服中台</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              定价
            </Link>
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
      <section className="container py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          不止回复问题，更懂经营增长
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          覆盖淘宝、抖音的 AI 智能客服中台。自动接待、智能导购、降低退款，
          让客服从成本中心变成利润中心。
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-8 py-3 font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            免费开始使用
          </Link>
          <Link
            href="#features"
            className="rounded-lg border px-8 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            了解更多
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-blue-500" />}
            title="AI 自动接待"
            description="7×24小时智能应答，大模型驱动，准确理解买家意图，自动推荐商品和催单"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-green-500" />}
            title="智能退款风控"
            description="多维度风险评估，自动挽单话术，帮您每月减少不必要的退款损失"
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8 text-purple-500" />}
            title="跨平台统一管理"
            description="淘宝、抖音、京东、拼多多，一个后台管理所有平台的客户咨询"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-orange-500" />}
            title="经营数据分析"
            description="从对话中挖掘商机，客户画像、竞品情报、商品反馈一目了然"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900">
          让 AI 客服帮您提升 20% 转化率，降低 30% 退款率
        </h2>
        <p className="mt-4 text-slate-600">
          已有 100+ 商家在使用 ECS，每月处理超过 50 万条客户消息
        </p>
        <Link
          href="/register"
          className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white hover:bg-primary/90"
        >
          立即开始
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-slate-500">
        &copy; 2026 ECS Platform. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
