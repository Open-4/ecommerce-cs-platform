"use client";

import { useState } from "react";
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingDown,
  Clock,
  User,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Bot,
} from "lucide-react";

// ============================================================
// 类型
// ============================================================

interface RefundRequest {
  id: string;
  orderId: string;
  buyerNick: string;
  platform: string;
  refundAmount: number; // 分
  reason: string;
  description: string;
  status: string;
  riskScore: number;
  aiRecommendation: string;
  urgency: "low" | "medium" | "high";
  createdAt: string;
  dimensions: Record<string, number>;
}

// 模拟数据
const MOCK_REFUNDS: RefundRequest[] = [
  {
    id: "r1",
    orderId: "TB20260608001",
    buyerNick: "张先生",
    platform: "taobao",
    refundAmount: 12900,
    reason: "商品与图片不符",
    description: "收到的颜色完全不一样，图片上是浅蓝，实物是深蓝",
    status: "pending",
    riskScore: 72,
    aiRecommendation: "agree",
    urgency: "high",
    createdAt: "2026-06-08 14:30",
    dimensions: {
      buyerReturnRate: 70,
      categoryReturnRate: 45,
      orderAmount: 30,
      logisticAbnormal: 0,
      buyerEmotion: 75,
      hasDisputeHistory: 0,
      refundReason: 60,
      conversationQuality: 40,
    },
  },
  {
    id: "r2",
    orderId: "DY20260608002",
    buyerNick: "李女士",
    platform: "douyin",
    refundAmount: 8900,
    reason: "不想要了",
    description: "买完发现家里已经有类似的了",
    status: "pending",
    riskScore: 38,
    aiRecommendation: "reject",
    urgency: "low",
    createdAt: "2026-06-08 13:15",
    dimensions: {
      buyerReturnRate: 25,
      categoryReturnRate: 30,
      orderAmount: 40,
      logisticAbnormal: 0,
      buyerEmotion: 10,
      hasDisputeHistory: 0,
      refundReason: 65,
      conversationQuality: 20,
    },
  },
  {
    id: "r3",
    orderId: "TB20260607003",
    buyerNick: "王小明",
    platform: "taobao",
    refundAmount: 25600,
    reason: "商品质量问题",
    description: "穿了一次就开线了，质量太差了",
    status: "pending",
    riskScore: 85,
    aiRecommendation: "agree",
    urgency: "high",
    createdAt: "2026-06-07 10:00",
    dimensions: {
      buyerReturnRate: 15,
      categoryReturnRate: 20,
      orderAmount: 15,
      logisticAbnormal: 0,
      buyerEmotion: 90,
      hasDisputeHistory: 30,
      refundReason: 30,
      conversationQuality: 70,
    },
  },
  {
    id: "r4",
    orderId: "TB20260606004",
    buyerNick: "赵女士123",
    platform: "taobao",
    refundAmount: 4500,
    reason: "快递破损",
    description: "收到的时候包装破了，里面东西也有划痕",
    status: "pending",
    riskScore: 90,
    aiRecommendation: "agree",
    urgency: "medium",
    createdAt: "2026-06-06 16:45",
    dimensions: {
      buyerReturnRate: 10,
      categoryReturnRate: 20,
      orderAmount: 50,
      logisticAbnormal: 80,
      buyerEmotion: 60,
      hasDisputeHistory: 0,
      refundReason: 70,
      conversationQuality: 50,
    },
  },
];

// 决策标签样式
const RECOMMENDATION_STYLES: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  agree: { label: "建议同意", className: "bg-green-100 text-green-700", icon: CheckCircle },
  reject: { label: "建议拒绝", className: "bg-red-100 text-red-700", icon: XCircle },
  negotiate: { label: "建议协商", className: "bg-orange-100 text-orange-700", icon: RefreshCw },
  partial: { label: "建议部分退款", className: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
};

// ============================================================
// 主组件
// ============================================================

export default function OrdersPage() {
  const [refunds] = useState<RefundRequest[]>(MOCK_REFUNDS);
  const [search, setSearch] = useState("");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);

  const filtered = refunds.filter(
    (r) =>
      !search ||
      r.orderId.includes(search) ||
      r.buyerNick.includes(search) ||
      r.reason.includes(search),
  );

  const stats = {
    total: refunds.length,
    highRisk: refunds.filter((r) => r.riskScore >= 70).length,
    avgAmount: Math.round(
      refunds.reduce((s, r) => s + r.refundAmount, 0) / refunds.length / 100,
    ),
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">退款决策</h1>
            <p className="mt-1 text-sm text-slate-500">
              AI 驱动的智能退款风险评估
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="待处理"
            value={stats.total}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            icon={AlertTriangle}
            label="高风险"
            value={stats.highRisk}
            color="text-red-600"
            bg="bg-red-50"
          />
          <StatCard
            icon={TrendingDown}
            label="平均退款额"
            value={`¥${stats.avgAmount}`}
            color="text-orange-600"
            bg="bg-orange-50"
          />
          <StatCard
            icon={Shield}
            label="AI 准确率"
            value="88%"
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 列表 */}
        <div className="flex w-[480px] flex-col border-r">
          <div className="border-b px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索订单号、买家..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((refund) => (
              <RefundCard
                key={refund.id}
                refund={refund}
                isSelected={selectedRefund?.id === refund.id}
                onClick={() => setSelectedRefund(refund)}
              />
            ))}
          </div>
        </div>

        {/* 详情 */}
        <div className="flex flex-1 overflow-y-auto">
          {selectedRefund ? (
            <RefundDetailPanel refund={selectedRefund} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-slate-500">选择一条退款申请查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// StatCard
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
      <div className={`rounded-lg p-2 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ============================================================
// RefundCard
// ============================================================

function RefundCard({
  refund,
  isSelected,
  onClick,
}: {
  refund: RefundRequest;
  isSelected: boolean;
  onClick: () => void;
}) {
  const rec = RECOMMENDATION_STYLES[refund.aiRecommendation]!;
  const RecIcon = rec.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
        isSelected ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            {refund.buyerNick}
          </span>
          <span className="rounded bg-slate-100 px-1.5 text-xs text-slate-500">
            {refund.platform === "taobao" ? "淘宝" : "抖音"}
          </span>
        </div>
        <span className="text-sm font-semibold text-slate-900">
          ¥{(refund.refundAmount / 100).toFixed(2)}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{refund.reason}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${rec.className}`}>
          <RecIcon className="h-3 w-3" />
          {rec.label}
        </span>
        <RiskBadge score={refund.riskScore} />
        {refund.urgency === "high" && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />
            紧急
          </span>
        )}
      </div>
    </button>
  );
}

function RiskBadge({ score }: { score: number }) {
  let color: string;
  if (score >= 70) color = "bg-red-100 text-red-700";
  else if (score >= 50) color = "bg-orange-100 text-orange-700";
  else if (score >= 30) color = "bg-yellow-100 text-yellow-700";
  else color = "bg-green-100 text-green-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>
      风险 {score} 分
    </span>
  );
}

// ============================================================
// RefundDetailPanel
// ============================================================

function RefundDetailPanel({ refund }: { refund: RefundRequest }) {
  const [showDimensions, setShowDimensions] = useState(true);
  const rec = RECOMMENDATION_STYLES[refund.aiRecommendation]!;

  return (
    <div className="w-full p-6">
      {/* 订单信息 */}
      <div className="mb-6 rounded-xl border bg-white p-4">
        <h3 className="mb-4 font-semibold text-slate-900">订单信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoItem label="订单号" value={refund.orderId} />
          <InfoItem
            label="平台"
            value={refund.platform === "taobao" ? "淘宝/天猫" : "抖音电商"}
          />
          <InfoItem label="买家" value={refund.buyerNick} />
          <InfoItem
            label="退款金额"
            value={`¥${(refund.refundAmount / 100).toFixed(2)}`}
            highlight
          />
          <InfoItem label="申请时间" value={refund.createdAt} />
          <InfoItem label="退款原因" value={refund.reason} />
        </div>
        {refund.description && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-600">{refund.description}</p>
          </div>
        )}
      </div>

      {/* AI 决策 */}
      <div className="mb-6 rounded-xl border bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-slate-900">AI 决策建议</h3>
          </div>
          <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${rec.className}`}>
            <rec.icon className="h-4 w-4" />
            {rec.label}
          </span>
        </div>

        {/* 风险评分进度条 */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-600">综合风险评分</span>
            <span className="font-semibold text-slate-900">{refund.riskScore}/100</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className={`h-3 rounded-full transition-all ${
                refund.riskScore >= 70
                  ? "bg-red-500"
                  : refund.riskScore >= 50
                    ? "bg-orange-500"
                    : refund.riskScore >= 30
                      ? "bg-yellow-500"
                      : "bg-green-500"
              }`}
              style={{ width: `${refund.riskScore}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            分数越高，建议同意退款的可能性越大
          </p>
        </div>

        {/* 维度详情 */}
        <button
          onClick={() => setShowDimensions(!showDimensions)}
          className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <span>风险维度明细</span>
          {showDimensions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showDimensions && (
          <div className="mt-2 space-y-2">
            {Object.entries(refund.dimensions).map(([key, value]) => (
              <DimensionBar
                key={key}
                label={dimensionLabel(key)}
                score={value}
              />
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700">
          同意退款
        </button>
        <button className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          协商方案
        </button>
        <button className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">
          拒绝退款
        </button>
        <button className="rounded-lg border px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
          转人工处理
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <p
        className={`text-sm ${highlight ? "font-semibold text-slate-900" : "text-slate-700"}`}
      >
        {value}
      </p>
    </div>
  );
}

function DimensionBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? "bg-red-500" : score >= 40 ? "bg-orange-400" : "bg-green-400";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-slate-600">{label}</span>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <span className="w-8 text-right text-xs text-slate-500">{score}</span>
    </div>
  );
}

function dimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    buyerReturnRate: "买家退货率",
    categoryReturnRate: "品类退货率",
    orderAmount: "订单金额因素",
    logisticAbnormal: "物流异常",
    buyerEmotion: "买家情绪",
    hasDisputeHistory: "纠纷历史",
    refundReason: "退款原因",
    conversationQuality: "沟通质量",
  };
  return labels[key] ?? key;
}
