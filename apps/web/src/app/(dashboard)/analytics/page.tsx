"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ============================================================
// 模拟数据
// ============================================================

const TODAY_STATS = {
  totalConversations: 342,
  aiHandled: 218,
  aiHandledRate: 63.7,
  humanHandled: 124,
  avgResponseTime: 12.3, // 秒
  customerSatisfaction: 4.2,
  refundsPrevented: 28,
  refundAmountSaved: 12680, // 元
  conversionRate: 18.5,
  comparedToYesterday: {
    conversations: 12.5,
    aiRate: 3.2,
    responseTime: -8.3,
    satisfaction: 0.3,
  },
};

const WEEKLY_TREND = [
  { day: "周一", conversations: 285, aiHandled: 172, humanHandled: 113 },
  { day: "周二", conversations: 310, aiHandled: 195, humanHandled: 115 },
  { day: "周三", conversations: 298, aiHandled: 188, humanHandled: 110 },
  { day: "周四", conversations: 335, aiHandled: 212, humanHandled: 123 },
  { day: "周五", conversations: 356, aiHandled: 228, humanHandled: 128 },
  { day: "周六", conversations: 278, aiHandled: 182, humanHandled: 96 },
  { day: "周日", conversations: 342, aiHandled: 218, humanHandled: 124 },
];

const INTENT_DISTRIBUTION = [
  { intent: "商品咨询", count: 85, percentage: 24.9 },
  { intent: "订单查询", count: 72, percentage: 21.1 },
  { intent: "物流查询", count: 58, percentage: 17.0 },
  { intent: "退款申请", count: 35, percentage: 10.2 },
  { intent: "议价/优惠", count: 28, percentage: 8.2 },
  { intent: "推荐咨询", count: 24, percentage: 7.0 },
  { intent: "投诉", count: 15, percentage: 4.4 },
  { intent: "其他", count: 25, percentage: 7.3 },
];

const TOP_QUESTIONS = [
  { question: "什么时候发货？", count: 156 },
  { question: "这件衣服缩水吗？", count: 89 },
  { question: "能便宜点吗？", count: 72 },
  { question: "有XXL号吗？", count: 68 },
  { question: "怎么退换货？", count: 54 },
];

// ============================================================
// 主组件
// ============================================================

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today",
  );

  const maxWeeklyValue = Math.max(
    ...WEEKLY_TREND.map((d) => d.conversations),
  );

  const maxIntentValue = Math.max(
    ...INTENT_DISTRIBUTION.map((d) => d.count),
  );

  const maxQuestionValue = Math.max(...TOP_QUESTIONS.map((q) => q.count));

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
          <p className="text-sm text-slate-500">
            客服数据 · 转化分析 · AI 效率
          </p>
        </div>
        <div className="flex rounded-lg border bg-white">
          {(["today", "week", "month"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === range
                  ? "bg-primary text-white first:rounded-l-lg last:rounded-r-lg"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {range === "today" ? "今日" : range === "week" ? "本周" : "本月"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KpiCard
          icon={MessageSquare}
          label="总会话数"
          value={TODAY_STATS.totalConversations}
          change={TODAY_STATS.comparedToYesterday.conversations}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <KpiCard
          icon={Zap}
          label="AI 处理率"
          value={`${TODAY_STATS.aiHandledRate}%`}
          change={TODAY_STATS.comparedToYesterday.aiRate}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <KpiCard
          icon={Clock}
          label="平均响应"
          value={`${TODAY_STATS.avgResponseTime}s`}
          change={TODAY_STATS.comparedToYesterday.responseTime}
          color="text-orange-600"
          bg="bg-orange-50"
          reverse
        />
        <KpiCard
          icon={ThumbsUp}
          label="满意度"
          value={`${TODAY_STATS.customerSatisfaction}/5`}
          change={TODAY_STATS.comparedToYesterday.satisfaction}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatHighlight
          icon={TrendingDown}
          label="阻止退款"
          value={`${TODAY_STATS.refundsPrevented} 单`}
          sub={`节省 ¥${TODAY_STATS.refundAmountSaved.toLocaleString()}`}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatHighlight
          icon={TrendingUp}
          label="询单转化率"
          value={`${TODAY_STATS.conversionRate}%`}
          sub="通过客服转化"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatHighlight
          icon={Users}
          label="人工处理"
          value={`${TODAY_STATS.humanHandled} 单`}
          sub={`占比 ${(100 - TODAY_STATS.aiHandledRate).toFixed(1)}%`}
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      {/* 图表区 */}
      <div className="mb-6 grid grid-cols-2 gap-6">
        {/* 周趋势图 */}
        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 font-semibold text-slate-900">本周趋势</h3>
          <div className="space-y-3">
            {WEEKLY_TREND.map((day) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-10 text-xs text-slate-500">{day.day}</span>
                <div className="flex flex-1 items-center gap-1">
                  <div
                    className="h-6 rounded bg-blue-400"
                    style={{
                      width: `${(day.aiHandled / maxWeeklyValue) * 100}%`,
                    }}
                  />
                  <div
                    className="h-6 rounded bg-orange-300"
                    style={{
                      width: `${(day.humanHandled / maxWeeklyValue) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-medium text-slate-700">
                  {day.conversations}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-blue-400" />
              AI 处理
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-orange-300" />
              人工处理
            </span>
          </div>
        </div>

        {/* 意图分布 */}
        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 font-semibold text-slate-900">意图分布</h3>
          <div className="space-y-3">
            {INTENT_DISTRIBUTION.map((item) => (
              <div key={item.intent} className="flex items-center gap-3">
                <span className="w-20 text-xs text-slate-600">
                  {item.intent}
                </span>
                <div className="flex-1">
                  <div
                    className="h-6 rounded bg-gradient-to-r from-blue-400 to-blue-300"
                    style={{
                      width: `${(item.count / maxIntentValue) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-slate-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 高频问题 */}
        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 font-semibold text-slate-900">
            高频问题 Top 5
          </h3>
          <div className="space-y-4">
            {TOP_QUESTIONS.map((item, i) => (
              <div key={item.question} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-slate-700">
                  {item.question}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {item.count} 次
                </span>
                <div className="w-24">
                  <div
                    className="h-2 rounded-full bg-blue-100"
                  >
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${(item.count / maxQuestionValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 效能 */}
        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 font-semibold text-slate-900">AI 效能分析</h3>
          <div className="grid grid-cols-2 gap-4">
            <AiMetricCard
              label="意图识别准确率"
              value="94.2%"
              icon={Zap}
              color="text-purple-500"
            />
            <AiMetricCard
              label="FAQ 匹配率"
              value="87.5%"
              icon={MessageSquare}
              color="text-blue-500"
            />
            <AiMetricCard
              label="退款建议采纳率"
              value="82.1%"
              icon={ThumbsUp}
              color="text-green-500"
            />
            <AiMetricCard
              label="需人工升级率"
              value="12.8%"
              icon={AlertTriangle}
              color="text-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KPI Cards
// ============================================================

function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  color,
  bg,
  reverse,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string | number;
  change: number;
  color: string;
  bg: string;
  reverse?: boolean;
}) {
  const isPositive = reverse ? change < 0 : change > 0;

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? "text-green-600" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StatHighlight({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
      <div className={`rounded-xl p-3 ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function AiMetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Zap;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <Icon className={`mb-2 h-5 w-5 ${color}`} />
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
