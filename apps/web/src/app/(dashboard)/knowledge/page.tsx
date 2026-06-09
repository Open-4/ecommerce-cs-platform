"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Package,
  Shield,
  Truck,
  Ruler,
  Upload,
  Download,
  Copy,
  X,
} from "lucide-react";

// ============================================================
// 类型
// ============================================================

interface KnowledgeEntry {
  id: string;
  category: string;
  question?: string;
  answer: string;
  usageCount: number;
  source: string;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: "faq", label: "常见问题", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  { value: "product", label: "商品知识", icon: Package, color: "text-green-600 bg-green-50" },
  { value: "policy", label: "售后政策", icon: Shield, color: "text-orange-600 bg-orange-50" },
  { value: "shipping", label: "物流相关", icon: Truck, color: "text-purple-600 bg-purple-50" },
  { value: "size", label: "尺码指南", icon: Ruler, color: "text-pink-600 bg-pink-50" },
];

// 模拟数据
const MOCK_ENTRIES: KnowledgeEntry[] = [
  {
    id: "1",
    category: "faq",
    question: "这件衣服缩水吗？",
    answer: "本品经过预缩处理，正常洗涤不会缩水。建议冷水手洗或机洗轻柔模式，避免高温烘干。",
    usageCount: 156,
    source: "manual",
    isActive: true,
    createdAt: "2026-06-01",
  },
  {
    id: "2",
    category: "shipping",
    question: "什么时候发货？",
    answer: "下单后48小时内发货，默认发中通快递。16:00前下单当天发，16:00后次日发。",
    usageCount: 342,
    source: "manual",
    isActive: true,
    createdAt: "2026-05-28",
  },
  {
    id: "3",
    category: "policy",
    question: "退换货政策",
    answer: "支持7天无理由退换。退回商品需保持原包装完好、不影响二次销售。非质量问题退货运费由买家承担，质量问题我们承担来回运费。",
    usageCount: 89,
    source: "manual",
    isActive: true,
    createdAt: "2026-05-20",
  },
  {
    id: "4",
    category: "product",
    question: "这件T恤是什么材质的？",
    answer: "100%新疆长绒棉，克重220g，透气性好，穿着舒适不闷汗。经过丝光处理，手感顺滑，不易起球。",
    usageCount: 203,
    source: "product_sync",
    isActive: true,
    createdAt: "2026-06-03",
  },
  {
    id: "5",
    category: "size",
    question: "我172cm 65kg穿什么码？",
    answer: "根据您172cm/65kg的身材，推荐M码（合身）或L码（宽松）。M码衣长70cm胸围104cm，L码衣长72cm胸围108cm。",
    usageCount: 178,
    source: "conversation",
    isActive: true,
    createdAt: "2026-06-05",
  },
];

// ============================================================
// 主组件
// ============================================================

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(MOCK_ENTRIES);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // 过滤
  const filtered = entries.filter((e) => {
    const matchCategory = activeCategory === "all" || e.category === activeCategory;
    const matchSearch =
      !search ||
      e.question?.includes(search) ||
      e.answer.includes(search);
    return matchCategory && matchSearch;
  });

  // 分类统计
  const categoryStats = CATEGORIES.map((cat) => {
    const count = entries.filter((e) => e.category === cat.value).length;
    return { ...cat, count };
  });

  const totalEntries = entries.length;
  const totalUsage = entries.reduce((sum, e) => sum + e.usageCount, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">知识库管理</h1>
            <p className="mt-1 text-sm text-slate-500">
              {totalEntries} 条知识 · 累计引用 {totalUsage} 次
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              批量导入
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              添加知识
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧分类 */}
        <div className="w-56 border-r bg-white p-4">
          <button
            onClick={() => setActiveCategory("all")}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeCategory === "all"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            全部 ({totalEntries})
          </button>
          {categoryStats.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                activeCategory === cat.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
              <span className="ml-auto text-xs text-slate-400">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* 右侧列表 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 搜索栏 */}
          <div className="border-b bg-white px-6 py-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索问题或答案..."
                className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 知识列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4">
              {filtered.map((entry) => (
                <KnowledgeCard
                  key={entry.id}
                  entry={entry}
                  isSelected={selectedEntry?.id === entry.id}
                  onClick={() =>
                    setSelectedEntry(
                      selectedEntry?.id === entry.id ? null : entry,
                    )
                  }
                  onEdit={() => {
                    setSelectedEntry(entry);
                    setShowEditModal(true);
                  }}
                  onDelete={() => {
                    setEntries((prev) =>
                      prev.filter((e) => e.id !== entry.id),
                    );
                    if (selectedEntry?.id === entry.id) setSelectedEntry(null);
                  }}
                />
              ))}
              {filtered.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  <BookOpen className="mx-auto h-10 w-10" />
                  <p className="mt-3">暂无匹配的知识条目</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    添加第一条知识
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧详情面板 */}
        {selectedEntry && (
          <div className="w-96 border-l bg-white">
            <DetailPanel
              entry={selectedEntry}
              onClose={() => setSelectedEntry(null)}
            />
          </div>
        )}
      </div>

      {/* 添加弹窗 */}
      {showAddModal && (
        <KnowledgeModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSave={(data) => {
            const newEntry: KnowledgeEntry = {
              id: `new-${Date.now()}`,
              ...data,
              usageCount: 0,
              source: "manual",
              isActive: true,
              createdAt: new Date().toISOString().split("T")[0]!,
            };
            setEntries((prev) => [newEntry, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* 编辑弹窗 */}
      {showEditModal && selectedEntry && (
        <KnowledgeModal
          mode="edit"
          entry={selectedEntry}
          onClose={() => setShowEditModal(false)}
          onSave={(data) => {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === selectedEntry.id ? { ...e, ...data } : e,
              ),
            );
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// KnowledgeCard
// ============================================================

function KnowledgeCard({
  entry,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  entry: KnowledgeEntry;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === entry.category);
  const Icon = cat?.icon ?? BookOpen;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-sm ${
        isSelected
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
          : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {entry.question && (
            <h4 className="font-medium text-slate-900">{entry.question}</h4>
          )}
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
            {entry.answer}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        {cat && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${cat.color}`}>
            <Icon className="h-3 w-3" />
            {cat.label}
          </span>
        )}
        <span>引用 {entry.usageCount} 次</span>
        <span>{entry.source === "manual" ? "手动添加" : entry.source === "conversation" ? "对话提取" : "商品同步"}</span>
      </div>
    </div>
  );
}

// ============================================================
// DetailPanel
// ============================================================

function DetailPanel({
  entry,
  onClose,
}: {
  entry: KnowledgeEntry;
  onClose: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === entry.category);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-slate-900">知识详情</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            分类
          </label>
          <span className="text-sm text-slate-700">{cat?.label ?? entry.category}</span>
        </div>
        {entry.question && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              标准问题
            </label>
            <p className="text-sm text-slate-900">{entry.question}</p>
          </div>
        )}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            标准答案
          </label>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm leading-relaxed text-slate-700">
              {entry.answer}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            统计
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded bg-slate-50 p-2">
              <span className="text-slate-500">引用次数</span>
              <p className="font-semibold text-slate-900">{entry.usageCount}</p>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <span className="text-slate-500">来源</span>
              <p className="text-slate-700">{entry.source}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KnowledgeModal
// ============================================================

function KnowledgeModal({
  mode,
  entry,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  entry?: KnowledgeEntry;
  onClose: () => void;
  onSave: (data: { category: string; question?: string; answer: string }) => void;
}) {
  const [category, setCategory] = useState(entry?.category ?? "faq");
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-semibold text-slate-900">
            {mode === "add" ? "添加知识" : "编辑知识"}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              <span>标准问题</span>
              <span className="ml-1 text-xs text-slate-400">（可选，FAQ 类型必填）</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="买家常问的问题..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              标准答案
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="AI 会基于这个答案回复买家，请尽量详细和专业..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={() => onSave({ category, question: question || undefined, answer })}
            disabled={!answer.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {mode === "add" ? "添加" : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
