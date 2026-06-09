"use client";

import { useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";

// 模拟数据（后续从 API 获取）
const MOCK_CONVERSATIONS = [
  { id: "1", buyerNick: "张先生", status: "ai_replied", lastMessage: "这个衣服缩水吗？", lastMessageAt: "2分钟前", unreadCount: 0, platform: "taobao" },
  { id: "2", buyerNick: "李女士", status: "need_human", lastMessage: "我收到的货和图片颜色不一样，我要退款", lastMessageAt: "5分钟前", unreadCount: 3, platform: "douyin" },
  { id: "3", buyerNick: "王小明", status: "new", lastMessage: "L码还有货吗？", lastMessageAt: "10分钟前", unreadCount: 1, platform: "taobao" },
  { id: "4", buyerNick: "赵女士123", status: "resolved", lastMessage: "好的谢谢", lastMessageAt: "1小时前", unreadCount: 0, platform: "taobao" },
  { id: "5", buyerNick: "陈大文", status: "ai_processing", lastMessage: "能便宜点吗？我买了三件了", lastMessageAt: "2小时前", unreadCount: 0, platform: "douyin" },
];

const STATUS_TEXT: Record<string, string> = {
  new: "新会话", ai_processing: "AI处理中", ai_replied: "AI已回复",
  need_human: "需人工", human_processing: "人工中", resolved: "已解决", closed: "已关闭",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-700", ai_processing: "bg-purple-100 text-purple-700",
  ai_replied: "bg-green-100 text-green-700", need_human: "bg-orange-100 text-orange-700",
  human_processing: "bg-yellow-100 text-yellow-700", resolved: "bg-slate-100 text-slate-700",
  closed: "bg-slate-100 text-slate-500",
};

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selected = MOCK_CONVERSATIONS.find((c) => c.id === selectedId);

  return (
    <div className="flex h-full">
      {/* 会话列表 */}
      <div className="w-80 border-r bg-white">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索会话..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              全部
            </button>
            <button className="rounded-full px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">
              需要人工
            </button>
            <button className="rounded-full px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">
              AI 处理中
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {MOCK_CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full border-b p-4 text-left transition-colors hover:bg-slate-50 ${
                selectedId === conv.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{conv.buyerNick}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[conv.status]}`}>
                  {STATUS_TEXT[conv.status]}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-600">{conv.lastMessage}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-400">{conv.lastMessageAt}</span>
                <span className="rounded bg-red-50 px-1.5 text-xs text-red-500">
                  {conv.platform === "taobao" ? "淘宝" : "抖音"}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-xs text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 聊天窗口 */}
      <div className="flex flex-1 flex-col">
        {selected ? (
          <ChatWindow
            conversationId={selected.id}
            buyerNick={selected.buyerNick}
            platform={selected.platform}
            status={selected.status}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-700">
                选择一个会话开始
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                从左侧列表中选择一个会话查看详情
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
