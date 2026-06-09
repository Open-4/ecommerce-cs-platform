"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Store,
  BookOpen,
  Settings,
  Zap,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// ============================================================
// 入驻步骤定义
// ============================================================

const STEPS = [
  {
    id: "connect",
    title: "连接店铺",
    subtitle: "授权平台，接入您的淘宝或抖音店铺",
    icon: Store,
  },
  {
    id: "knowledge",
    title: "知识配置",
    subtitle: "导入商品信息，添加 FAQ 知识库",
    icon: BookOpen,
  },
  {
    id: "ai-setup",
    title: "AI 设置",
    subtitle: "设置自动回复规则和品牌风格",
    icon: Settings,
  },
  {
    id: "go-live",
    title: "上线运行",
    subtitle: "开启 AI 客服，开始服务您的客户",
    icon: Zap,
  },
];

// ============================================================
// 主组件
// ============================================================

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // 平台连接状态
  const [connectedPlatforms, setConnectedPlatforms] = useState<
    { platform: string; shopName: string; status: string }[]
  >([]);

  // 知识库状态
  const [knowledgeCount, setKnowledgeCount] = useState(0);

  // AI 配置
  const [aiConfig, setAiConfig] = useState({
    autoReplyEnabled: true,
    confidenceThreshold: 80,
    brandTone: "专业友好",
    workingHoursStart: "09:00",
    workingHoursEnd: "22:00",
  });

  const markStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);
  };

  const goNext = () => {
    markStepComplete(currentStep);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const allDone = completedSteps.size === STEPS.length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 左侧进度条 */}
      <div className="w-72 shrink-0 border-r bg-white p-6">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900">店铺入驻</h2>
          <p className="mt-1 text-sm text-slate-500">
            4 步开启 AI 智能客服
          </p>
        </div>

        <div className="space-y-1">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = completedSteps.has(i);
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => completedSteps.has(i) && setCurrentStep(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : isDone
                      ? "text-slate-700 hover:bg-slate-50 cursor-pointer"
                      : "text-slate-400 cursor-default"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-primary text-white"
                      : isDone
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs opacity-70">{step.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 预估用时 */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-700">
            预计 5 分钟完成配置
          </p>
          <p className="mt-1 text-xs text-blue-600">
            完成后即可开启 AI 自动客服
          </p>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex flex-1 flex-col">
        {/* 顶部进度条 */}
        <div className="border-b bg-white px-8 py-4">
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    i <= currentStep || completedSteps.has(i)
                      ? "bg-primary w-16"
                      : "bg-slate-200 w-16"
                  }`}
                />
                {i < STEPS.length - 1 && (
                  <div className="w-2" />
                )}
              </div>
            ))}
            <span className="ml-3 text-xs text-slate-500">
              步骤 {currentStep + 1}/{STEPS.length}
            </span>
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStep === 0 && (
            <ConnectPlatformStep
              connectedPlatforms={connectedPlatforms}
              setConnectedPlatforms={setConnectedPlatforms}
            />
          )}
          {currentStep === 1 && (
            <KnowledgeStep
              knowledgeCount={knowledgeCount}
              setKnowledgeCount={setKnowledgeCount}
            />
          )}
          {currentStep === 2 && (
            <AiSetupStep aiConfig={aiConfig} setAiConfig={setAiConfig} />
          )}
          {currentStep === 3 && (
            <GoLiveStep
              connectedPlatforms={connectedPlatforms}
              knowledgeCount={knowledgeCount}
              aiConfig={aiConfig}
            />
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between border-t bg-white px-8 py-4">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            上一步
          </button>

          {isLastStep ? (
            <button
              onClick={() => {
                markStepComplete(currentStep);
                router.push("/conversations");
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              完成入驻，开始使用
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              下一步
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 1: 连接平台
// ============================================================

function ConnectPlatformStep({
  connectedPlatforms,
  setConnectedPlatforms,
}: {
  connectedPlatforms: { platform: string; shopName: string; status: string }[];
  setConnectedPlatforms: (
    v: { platform: string; shopName: string; status: string }[],
  ) => void;
}) {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null,
  );

  const platforms = [
    {
      id: "taobao",
      name: "淘宝/天猫",
      icon: "🍑",
      description: "授权您的淘宝或天猫店铺，自动同步商品和订单信息",
      steps: [
        "前往淘宝开放平台创建应用",
        "获取 AppKey 和 AppSecret",
        "在本页面完成 OAuth 授权",
      ],
      docUrl: "https://open.taobao.com/",
    },
    {
      id: "douyin",
      name: "抖音电商",
      icon: "🎵",
      description: "连接抖音小店，自动处理抖店客户消息",
      steps: [
        "前往抖音开放平台创建应用",
        "获取应用凭证",
        "完成授权接入",
      ],
      docUrl: "https://open.douyin.com/",
    },
  ];

  const handleConnect = (platformId: string) => {
    setConnectingPlatform(platformId);

    // 模拟 OAuth 连接过程
    setTimeout(() => {
      const platformName = platformId === "taobao" ? "淘宝店铺" : "抖音小店";

      setConnectedPlatforms([
        ...connectedPlatforms.filter((p) => p.platform !== platformId),
        {
          platform: platformId,
          shopName: `${platformName}旗舰店`,
          status: "connected",
        },
      ]);

      setConnectingPlatform(null);
    }, 2000);
  };

  const isConnected = (platformId: string) =>
    connectedPlatforms.some((p) => p.platform === platformId);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">连接您的店铺</h2>
        <p className="mt-2 text-slate-600">
          授权 ECS 接入您的电商平台店铺，我们将自动同步商品信息并处理客户消息
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id);
          const connecting = connectingPlatform === platform.id;

          return (
            <div
              key={platform.id}
              className={`rounded-xl border p-6 transition-all ${
                connected
                  ? "border-green-200 bg-green-50/50"
                  : "bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {platform.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {platform.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={connected || connecting}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    connected
                      ? "bg-green-100 text-green-700 cursor-default"
                      : connecting
                        ? "bg-slate-100 text-slate-400 cursor-wait"
                        : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {connected ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      已连接
                    </span>
                  ) : connecting ? (
                    "连接中..."
                  ) : (
                    "连接店铺"
                  )}
                </button>
              </div>

              {/* 连接后的详情 */}
              {connected && (
                <div className="mt-4 rounded-lg bg-white p-3 text-sm">
                  <p className="font-medium text-slate-700">
                    已连接:{" "}
                    {
                      connectedPlatforms.find((p) => p.platform === platform.id)
                        ?.shopName
                    }
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    商品和订单数据正在自动同步中...
                  </p>
                </div>
              )}

              {/* 操作步骤 */}
              {!connected && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-xs font-medium text-slate-500">
                    接入步骤:
                  </p>
                  {platform.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                        {i + 1}
                      </span>
                      {step}
                      {i === 0 && (
                        <a
                          href={platform.docUrl}
                          target="_blank"
                          className="ml-1 text-primary hover:underline"
                        >
                          前往 <ExternalLink className="inline h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 提示 */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-800">关于授权</p>
            <p className="mt-1 text-sm text-blue-700">
              ECS 只会读取您的店铺消息和商品信息，不会修改您的商品价格、库存或订单状态。
              所有 AI 回复都需经过您设置的规则审核。您可以随时在平台后台撤销授权。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 2: 知识配置
// ============================================================

function KnowledgeStep({
  knowledgeCount,
  setKnowledgeCount,
}: {
  knowledgeCount: number;
  setKnowledgeCount: (n: number) => void;
}) {
  const [faqList, setFaqList] = useState([
    { question: "什么时候发货？", answer: "下单后48小时内发货，16:00前下单当天发出。" },
    { question: "支持退换货吗？", answer: "支持7天无理由退换，质量问题我们承担来回运费。" },
    { question: "尺码怎么选？", answer: "请参考商品详情页的尺码表，或告诉我您的身高体重我帮您推荐。" },
  ]);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "done">("idle");

  const addFaq = () => {
    if (newQ.trim() && newA.trim()) {
      setFaqList([...faqList, { question: newQ.trim(), answer: newA.trim() }]);
      setNewQ("");
      setNewA("");
      setShowAddFaq(false);
      setKnowledgeCount(faqList.length + 1);
    }
  };

  const handleImportProducts = () => {
    setImportStatus("importing");
    setTimeout(() => {
      // 模拟导入商品
      const productFaqs = [
        { question: "这件是什么材质？", answer: "100%纯棉，舒适透气，经过预缩处理不缩水。" },
        { question: "有XXL号吗？", answer: "有的，请查看商品规格选择对应尺码下单。" },
      ];
      setFaqList([...faqList, ...productFaqs]);
      setKnowledgeCount(faqList.length + 2);
      setImportStatus("done");
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">知识库配置</h2>
        <p className="mt-2 text-slate-600">
          AI 将基于这些知识来回答客户问题。知识越全面，回复越准确。
        </p>
      </div>

      {/* 自动导入 */}
      <div className="mb-6 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">自动导入商品信息</h3>
            <p className="mt-1 text-sm text-slate-500">
              从已连接的店铺自动同步商品标题、属性、详情作为知识
            </p>
          </div>
          <button
            onClick={handleImportProducts}
            disabled={importStatus !== "idle"}
            className="shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {importStatus === "idle" && "一键导入"}
            {importStatus === "importing" && "导入中..."}
            {importStatus === "done" && "已导入 ✓"}
          </button>
        </div>
      </div>

      {/* FAQ 列表 */}
      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            FAQ 问答对 ({faqList.length})
          </h3>
          <button
            onClick={() => setShowAddFaq(true)}
            className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            + 添加 FAQ
          </button>
        </div>

        <div className="divide-y">
          {faqList.map((faq, i) => (
            <div key={i} className="px-5 py-3">
              <p className="text-sm font-medium text-slate-800">
                Q: {faq.question}
              </p>
              <p className="mt-1 text-sm text-slate-600">A: {faq.answer}</p>
            </div>
          ))}

          {showAddFaq && (
            <div className="space-y-3 p-5 bg-slate-50">
              <input
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder="问题，如: 这件衣服会缩水吗？"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <textarea
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
                rows={3}
                placeholder="答案，如: 本品经过预缩处理，正常洗涤不会缩水..."
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={addFaq}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  确认添加
                </button>
                <button
                  onClick={() => setShowAddFaq(false)}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 快速预设 */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-slate-500">
          快速预设模板:
        </p>
        <div className="flex flex-wrap gap-2">
          {["发货相关", "退换货政策", "尺码指南", "材质说明", "优惠活动"].map(
            (tag) => (
              <button
                key={tag}
                onClick={() => {
                  setShowAddFaq(true);
                  setNewQ(`关于${tag}`);
                  setNewA(`关于${tag}的详细信息，请联系人工客服获取最新政策。`);
                }}
                className="rounded-full border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:border-primary hover:text-primary"
              >
                + {tag}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 3: AI 设置
// ============================================================

function AiSetupStep({
  aiConfig,
  setAiConfig,
}: {
  aiConfig: {
    autoReplyEnabled: boolean;
    confidenceThreshold: number;
    brandTone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
  };
  setAiConfig: (c: typeof aiConfig) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">AI 回复设置</h2>
        <p className="mt-2 text-slate-600">
          配置 AI 客服的行为规则，确保回复符合您的品牌风格
        </p>
      </div>

      <div className="space-y-6">
        {/* 自动回复开关 */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">自动回复</h3>
              <p className="mt-1 text-sm text-slate-500">
                开启后 AI 将自动回复符合条件的客户消息
              </p>
            </div>
            <button
              onClick={() =>
                setAiConfig({
                  ...aiConfig,
                  autoReplyEnabled: !aiConfig.autoReplyEnabled,
                })
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                aiConfig.autoReplyEnabled ? "bg-primary" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  aiConfig.autoReplyEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 置信度阈值 */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-slate-900">AI 置信度阈值</h3>
          <p className="mt-1 text-sm text-slate-500">
            低于此阈值的问题将转人工处理，避免 AI 答错
          </p>
          <div className="mt-4">
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={aiConfig.confidenceThreshold}
              onChange={(e) =>
                setAiConfig({
                  ...aiConfig,
                  confidenceThreshold: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>50% (激进)</span>
              <span className="font-medium text-primary">
                {aiConfig.confidenceThreshold}%
              </span>
              <span>95% (保守)</span>
            </div>
          </div>
        </div>

        {/* 品牌风格 */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-slate-900">品牌回复风格</h3>
          <p className="mt-1 text-sm text-slate-500">
            决定 AI 回复的语气和表达方式
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: "专业友好", desc: "正式但不失温度", example: "您好！很高兴为您服务~" },
              { value: "亲切活泼", desc: "轻松有趣，拉近距离", example: "亲！这件超棒的哦~" },
              { value: "简洁高效", desc: "直奔主题，少废话", example: "好的，48小时内发货。" },
            ].map((style) => (
              <button
                key={style.value}
                onClick={() =>
                  setAiConfig({ ...aiConfig, brandTone: style.value })
                }
                className={`rounded-lg border p-4 text-left transition-all ${
                  aiConfig.brandTone === style.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-slate-900">{style.value}</p>
                <p className="mt-1 text-xs text-slate-500">{style.desc}</p>
                <p className="mt-2 text-xs italic text-slate-400">
                  "{style.example}"
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 工作时间 */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-slate-900">工作时间</h3>
          <p className="mt-1 text-sm text-slate-500">
            工作时间外，AI 全自动处理；工作时间内，AI 辅助人工
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <label className="text-xs text-slate-500">开始</label>
              <input
                type="time"
                value={aiConfig.workingHoursStart}
                onChange={(e) =>
                  setAiConfig({ ...aiConfig, workingHoursStart: e.target.value })
                }
                className="mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <span className="mt-5 text-slate-400">至</span>
            <div>
              <label className="text-xs text-slate-500">结束</label>
              <input
                type="time"
                value={aiConfig.workingHoursEnd}
                onChange={(e) =>
                  setAiConfig({ ...aiConfig, workingHoursEnd: e.target.value })
                }
                className="mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 4: 上线运行
// ============================================================

function GoLiveStep({
  connectedPlatforms,
  knowledgeCount,
  aiConfig,
}: {
  connectedPlatforms: { platform: string; shopName: string }[];
  knowledgeCount: number;
  aiConfig: { autoReplyEnabled: boolean; confidenceThreshold: number; brandTone: string };
}) {
  const [isActivating, setIsActivating] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleActivate = () => {
    setIsActivating(true);
    // 模拟激活过程
    setTimeout(() => {
      setIsActivating(false);
      setIsActive(true);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">准备上线</h2>
        <p className="mt-2 text-slate-600">
          确认以下配置无误后，即可开启 AI 客服
        </p>
      </div>

      {/* 配置摘要 */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-900">配置摘要</h3>

          <div className="space-y-3">
            <ConfigRow
              label="已连接平台"
              value={
                connectedPlatforms.length > 0
                  ? connectedPlatforms.map((p) => p.shopName).join("、")
                  : "未连接"
              }
              status={
                connectedPlatforms.length > 0 ? "success" : "warning"
              }
            />
            <ConfigRow
              label="知识库条目"
              value={knowledgeCount > 0 ? `${knowledgeCount} 条` : "未配置"}
              status={knowledgeCount > 0 ? "success" : "warning"}
            />
            <ConfigRow
              label="自动回复"
              value={aiConfig.autoReplyEnabled ? "已开启" : "已关闭"}
              status={aiConfig.autoReplyEnabled ? "success" : "info"}
            />
            <ConfigRow
              label="置信度阈值"
              value={`${aiConfig.confidenceThreshold}%`}
              status="info"
            />
            <ConfigRow
              label="品牌风格"
              value={aiConfig.brandTone}
              status="info"
            />
          </div>
        </div>

        {/* 如何工作 */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-900">
            激活后会发生什么
          </h3>
          <div className="space-y-3">
            {[
              {
                title: "消息接入",
                desc: "客户在淘宝/抖音发消息 → 自动出现在 ECS 会话列表",
              },
              {
                title: "AI 处理",
                desc: "AI 自动识别意图 → 检索知识库 → 生成回复建议",
              },
              {
                title: "人工把控",
                desc: "高置信度问题自动回复，低置信度/高风险转人工确认",
              },
              {
                title: "持续优化",
                desc: "您的每次人工修正都会优化 AI，越用越聪明",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 激活按钮 */}
        {!isActive ? (
          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-white hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/25"
          >
            <Zap className="h-5 w-5" />
            {isActivating ? "正在激活 AI 客服..." : "开启 AI 智能客服"}
          </button>
        ) : (
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-3 text-lg font-bold text-green-800">
              AI 客服已激活！
            </h3>
            <p className="mt-1 text-sm text-green-700">
              您的客户现在可以在已连接的平台发送消息，ECS 将自动处理
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 组件
// ============================================================

function ConfigRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "success" | "warning" | "info";
}) {
  const statusColors = {
    success: "text-green-600 bg-green-50",
    warning: "text-orange-600 bg-orange-50",
    info: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
      >
        {value}
      </span>
    </div>
  );
}
