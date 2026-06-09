"use client";

import { useState } from "react";
import {
  Settings,
  Store,
  Zap,
  Clock,
  Shield,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"shop" | "ai" | "guide">("shop");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">设置</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tabs */}
        <div className="w-48 border-r bg-white p-4 space-y-1">
          <TabButton
            icon={Store}
            label="店铺管理"
            active={activeTab === "shop"}
            onClick={() => setActiveTab("shop")}
          />
          <TabButton
            icon={Zap}
            label="AI 配置"
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
          <TabButton
            icon={HelpCircle}
            label="使用指南"
            active={activeTab === "guide"}
            onClick={() => setActiveTab("guide")}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "shop" && <ShopSettings />}
          {activeTab === "ai" && <AiSettings />}
          {activeTab === "guide" && <UsageGuide />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Store;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================
// 店铺管理
// ============================================================

function ShopSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 font-semibold text-slate-900">已连接店铺</h3>
        <div className="space-y-3">
          <ShopCard
            platform="taobao"
            name="淘宝店铺旗舰店"
            status="connected"
            lastSync="10分钟前"
          />
          <ShopCard
            platform="douyin"
            name="抖音小店"
            status="disconnected"
            lastSync="未连接"
          />
        </div>
        <button className="mt-4 rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          + 连接新店铺
        </button>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-2 font-semibold text-slate-900">团队成员</h3>
        <p className="text-sm text-slate-500">
          添加客服人员，分配会话处理权限
        </p>
        <div className="mt-4 space-y-2">
          <TeamMember name="张三 (管理员)" role="admin" />
          <TeamMember name="李四 (客服)" role="agent" />
        </div>
        <button className="mt-4 rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          + 邀请成员
        </button>
      </div>
    </div>
  );
}

function ShopCard({
  platform,
  name,
  status,
  lastSync,
}: {
  platform: string;
  name: string;
  status: string;
  lastSync: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <span className="text-xl">{platform === "taobao" ? "🍑" : "🎵"}</span>
        <div>
          <p className="text-sm font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">最后同步: {lastSync}</p>
        </div>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status === "connected"
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {status === "connected" ? "已连接" : "未连接"}
      </span>
    </div>
  );
}

function TeamMember({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {name.charAt(0)}
        </div>
        <p className="text-sm font-medium text-slate-800">{name}</p>
      </div>
      <span className="text-xs text-slate-500">
        {role === "admin" ? "管理员" : "客服"}
      </span>
    </div>
  );
}

// ============================================================
// AI 配置
// ============================================================

function AiSettings() {
  const [autoReply, setAutoReply] = useState(true);
  const [threshold, setThreshold] = useState(80);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 font-semibold text-slate-900">自动回复</h3>
        <label className="flex items-center gap-3">
          <button
            onClick={() => setAutoReply(!autoReply)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              autoReply ? "bg-primary" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                autoReply ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <span className="text-sm text-slate-700">
            {autoReply ? "AI 自动回复已开启" : "AI 仅生成建议，不自动发送"}
          </span>
        </label>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 font-semibold text-slate-900">
          置信度阈值: {threshold}%
        </h3>
        <input
          type="range"
          min={50}
          max={95}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="mt-2 text-xs text-slate-500">
          低于此值的问题将转人工处理
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 font-semibold text-slate-900">工作时间</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-slate-500">开始</label>
            <input
              type="time"
              defaultValue="09:00"
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <span className="mt-5 text-slate-400">至</span>
          <div>
            <label className="text-xs text-slate-500">结束</label>
            <input
              type="time"
              defaultValue="22:00"
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          工作时间外 AI 全自动处理；工作时间内低置信度转人工
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 使用指南
// ============================================================

function UsageGuide() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, section: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* 概述 */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-2 text-lg font-bold text-slate-900">
          我们的智能客服怎么用？
        </h3>
        <p className="text-slate-600">
          ECS 是一套 AI 驱动的电商客服中台。商家通过以下步骤即可让 AI 处理客户消息：
        </p>
        <div className="mt-4 grid gap-3">
          {[
            { step: 1, title: "注册账号", desc: "用邮箱注册 ECS 账号，填写店铺名称" },
            { step: 2, title: "连接平台", desc: "在「入驻向导」中授权您的淘宝/抖音店铺" },
            { step: 3, title: "配置知识库", desc: "导入商品信息、添加 FAQ，让 AI 有据可依" },
            { step: 4, title: "开启 AI", desc: "一键激活，AI 开始自动处理客户消息" },
            { step: 5, title: "日常管理", desc: "在「会话管理」中查看 AI 处理结果，关键时刻人工介入" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {item.step}
              </span>
              <div>
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 三种使用方式 */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          商家接入 ECS 的三种方式
        </h3>

        <div className="space-y-6">
          {/* 方式一 */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                推荐
              </span>
              <h4 className="font-semibold text-slate-900">
                方式一：平台 OAuth 接入（淘宝/抖音）
              </h4>
            </div>
            <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-1">
              <li>商家在 ECS 后台点击 "连接店铺"</li>
              <li>跳转到淘宝/抖音官方授权页面</li>
              <li>商家确认授权后，ECS 自动同步商品、接收消息</li>
              <li>AI 自动处理，人工可在后台实时查看和介入</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">
              适合：已在淘宝/抖音开店的商家，体验最完整
            </p>
          </div>

          {/* 方式二 */}
          <div className="rounded-lg bg-purple-50 p-4">
            <h4 className="mb-2 font-semibold text-slate-900">
              方式二：手动配置（适合测试体验）
            </h4>
            <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-1">
              <li>注册 ECS 账号，跳过平台授权步骤</li>
              <li>在「知识库」中手动添加 FAQ 问答对</li>
              <li>在「会话管理」中查看模拟会话，体验 AI 回复效果</li>
              <li>确认效果后，再完成真实的平台授权</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">
              适合：先体验再决定是否正式使用的商家
            </p>
          </div>

          {/* 方式三 */}
          <div className="rounded-lg bg-green-50 p-4">
            <h4 className="mb-2 font-semibold text-slate-900">
              方式三：API 接入（高级/定制）
            </h4>
            <p className="text-sm text-slate-600 mb-2">
              自有系统的商家可以通过 API 调用 ECS 的 AI 能力：
            </p>
            <div className="relative">
              <pre className="rounded-lg bg-slate-900 p-3 text-xs text-green-400 overflow-x-auto">
{`// 调用 ECS AI 处理消息
POST https://api.ecs.example.com/api/v1/ai/process
Authorization: Bearer <your_api_key>
{
  "conversationId": "xxx",
  "message": "这件衣服缩水吗？",
  "shopId": "xxx"
}

// 响应
{
  "reply": "本品经过预缩处理，正常洗涤不会缩水...",
  "confidence": 0.92,
  "intent": "product_inquiry",
  "usedKnowledge": ["面料FAQ-001"]
}`}</pre>
              <button
                onClick={() =>
                  copyCode(
                    `POST https://api.ecs.example.com/api/v1/ai/process\nAuthorization: Bearer <your_api_key>`,
                    "api",
                  )
                }
                className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                {copiedSection === "api" ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              适合：有自有系统或需要深度定制的商家/ISV
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">常见问题</h3>
        <div className="space-y-4">
          <FaqItem
            q="ECS 会直接操作我的店铺吗？"
            a="不会。ECS 只读取消息和商品信息，不会修改价格、库存或订单。所有 AI 回复都需经过您设置的规则审核。"
          />
          <FaqItem
            q="AI 回复错了怎么办？"
            a="AI 回复会先展示在后台作为「建议」，您可以审核修改后再发送。对于高置信度的简单问题，可以设置自动发送。同时您可以在知识库中持续优化答案。"
          />
          <FaqItem
            q="支持多少个平台？"
            a="目前支持淘宝/天猫和抖音电商，京东和拼多多正在开发中。一个 ECS 账号可以同时管理多个平台的多家店铺。"
          />
          <FaqItem
            q="数据安全吗？"
            a="您的店铺数据加密存储，我们不会用于训练模型或分享给第三方。可签署保密协议，支持私有化部署。"
          />
          <FaqItem
            q="怎么收费？"
            a="目前提供 14 天免费试用。正式版按会话量阶梯计费：月 5000 会话以下 199元/月，超出部分按量计费。大客户可定制方案。"
          />
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b pb-3 last:border-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-slate-800">{q}</span>
        <span className="text-slate-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-2 text-sm text-slate-600">{a}</p>}
    </div>
  );
}
