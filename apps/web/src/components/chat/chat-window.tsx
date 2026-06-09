"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Loader2, AlertTriangle, Bot, User, Clock } from "lucide-react";

// ============================================================
// 类型定义
// ============================================================

interface ChatMessage {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  senderType: "buyer" | "ai" | "human" | "system";
  contentType: string;
  content: string;
  aiGenerated?: boolean;
  aiConfidence?: number;
  humanReviewed?: boolean;
  sentAt: string;
}

interface ChatWindowProps {
  conversationId: string;
  buyerNick: string;
  platform: string;
  status: string;
  initialMessages?: ChatMessage[];
}

// ============================================================
// ChatWindow 组件
// ============================================================

export function ChatWindow({
  conversationId,
  buyerNick,
  platform,
  status,
  initialMessages = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket 连接
  useEffect(() => {
    const socket = io("http://localhost:4000/conversations", {
      query: { userId: "current-user" },
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    // 加入会话房间
    socket.emit("join_conversation", { conversationId });

    // 接收新消息
    socket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    // 接收 AI 建议
    socket.on("ai_suggestion", (data: { suggestion: string; confidence: number }) => {
      setAiSuggestion(data.suggestion);
    });

    socket.on("ai_processing_start", () => setIsAiProcessing(true));
    socket.on("ai_processing_end", () => setIsAiProcessing(false));

    socketRef.current = socket;

    return () => {
      socket.emit("leave_conversation", { conversationId });
      socket.disconnect();
    };
  }, [conversationId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const handleSend = useCallback(() => {
    if (!input.trim() || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId,
      direction: "outbound",
      senderType: "human",
      contentType: "text",
      content: input.trim(),
      sentAt: new Date().toISOString(),
    };

    // 乐观更新
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    socketRef.current.emit("send_message", {
      conversationId,
      content: input.trim(),
      contentType: "text",
    });

    // 清除 AI 建议
    setAiSuggestion(null);
  }, [input, conversationId]);

  // 采用 AI 建议
  const handleUseAiSuggestion = useCallback(() => {
    if (aiSuggestion) {
      setInput(aiSuggestion);
      setAiSuggestion(null);
    }
  }, [aiSuggestion]);

  // 回车发送
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <ChatHeader
        buyerNick={buyerNick}
        platform={platform}
        status={status}
        isConnected={isConnected}
        isAiProcessing={isAiProcessing}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">暂无消息</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* AI 输入中 */}
        {isAiProcessing && (
          <div className="mb-4 flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              <span className="text-sm text-purple-600">AI 正在生成回复...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI 建议条 */}
      {aiSuggestion && (
        <div className="border-t border-purple-100 bg-purple-50 px-4 py-2">
          <div className="flex items-start gap-2">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm text-purple-800">{aiSuggestion}</p>
              <button
                onClick={handleUseAiSuggestion}
                className="mt-1 text-xs font-medium text-purple-600 hover:text-purple-800"
              >
                采用此回复
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`回复 ${buyerNick}... (Enter 发送)`}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={!isConnected}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ChatHeader
// ============================================================

function ChatHeader({
  buyerNick,
  platform,
  status,
  isConnected,
  isAiProcessing,
}: {
  buyerNick: string;
  platform: string;
  status: string;
  isConnected: boolean;
  isAiProcessing: boolean;
}) {
  const statusLabels: Record<string, string> = {
    new: "新会话",
    ai_processing: "AI 处理中",
    ai_replied: "AI 已回复",
    need_human: "需要人工",
    human_processing: "人工处理中",
    resolved: "已解决",
    closed: "已关闭",
  };

  return (
    <div className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {buyerNick.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{buyerNick}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {platform === "taobao" ? "淘宝" : "抖音"}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {statusLabels[status] ?? status}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAiProcessing && (
          <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI 处理中
          </span>
        )}
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isConnected ? "bg-green-400" : "bg-red-400"
          }`}
        />
      </div>
    </div>
  );
}

// ============================================================
// MessageBubble
// ============================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isOutbound = message.direction === "outbound";
  const isAi = message.senderType === "ai";

  return (
    <div
      className={`mb-4 flex ${isOutbound ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
          isOutbound
            ? isAi
              ? "bg-purple-100 text-purple-900"
              : "bg-primary text-white"
            : "bg-white border text-slate-800"
        }`}
      >
        {/* AI 标签 */}
        {isAi && (
          <div className="mb-1 flex items-center gap-1">
            <Bot className="h-3 w-3 text-purple-500" />
            <span className="text-xs font-medium text-purple-600">AI 建议</span>
            {message.aiConfidence && (
              <span className="text-xs text-purple-400">
                ({Math.round(message.aiConfidence * 100)}%)
              </span>
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap text-sm">{message.content}</p>

        <p
          className={`mt-1 text-right text-xs ${
            isOutbound ? "text-white/70" : "text-slate-400"
          }`}
        >
          {formatTime(message.sentAt)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Utils
// ============================================================

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  return date.toLocaleDateString("zh-CN");
}
