// @ts-nocheck
import type { ConversationStatus } from "@ecs/shared";

// ============================================================
// 会话状态机
// ============================================================

/** 合法的状态转换映射 */
const VALID_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  new: ["ai_processing", "human_processing", "closed"],
  ai_processing: ["ai_replied", "need_human", "closed"],
  ai_replied: ["ai_processing", "need_human", "resolved", "closed"],
  need_human: ["human_processing", "closed"],
  human_processing: ["resolved", "ai_processing", "closed"],
  resolved: ["ai_processing", "need_human", "closed"],
  closed: ["new"], // 重新打开
};

/** 会话事件类型 */
export type ConversationEvent =
  | "message_received"
  | "ai_start_processing"
  | "ai_reply_generated"
  | "ai_confidence_low"
  | "escalated"
  | "human_takeover"
  | "human_reply_sent"
  | "resolved"
  | "closed"
  | "reopened";

/** 事件到状态的映射 */
const EVENT_TO_STATUS: Record<ConversationEvent, ConversationStatus> = {
  message_received: "new",
  ai_start_processing: "ai_processing",
  ai_reply_generated: "ai_replied",
  ai_confidence_low: "need_human",
  escalated: "need_human",
  human_takeover: "human_processing",
  human_reply_sent: "human_processing",
  resolved: "resolved",
  closed: "closed",
  reopened: "new",
};

/**
 * 检查状态转换是否合法
 */
export function canTransition(
  from: ConversationStatus,
  to: ConversationStatus,
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

/**
 * 执行状态转换
 */
export function transition(
  current: ConversationStatus,
  event: ConversationEvent,
): { newStatus: ConversationStatus; valid: boolean } {
  const targetStatus = EVENT_TO_STATUS[event];

  // 如果是同一状态，不需要转换
  if (targetStatus === current) {
    return { newStatus: current, valid: true };
  }

  if (canTransition(current, targetStatus)) {
    return { newStatus: targetStatus, valid: true };
  }

  return { newStatus: current, valid: false };
}

/**
 * 根据事件获取推荐状态
 */
export function getStatusForEvent(
  event: ConversationEvent,
): ConversationStatus {
  return EVENT_TO_STATUS[event];
}

/**
 * 获取某个状态下的可用操作
 */
export function getAvailableActions(
  status: ConversationStatus,
): ConversationEvent[] {
  const allowedStatuses = VALID_TRANSITIONS[status] ?? [];
  const actions: ConversationEvent[] = [];

  for (const [event, targetStatus] of Object.entries(EVENT_TO_STATUS)) {
    if (allowedStatuses.includes(targetStatus)) {
      actions.push(event as ConversationEvent);
    }
  }

  return actions;
}

/**
 * 判断是否应该由 AI 自动处理
 */
export function shouldAutoProcess(
  status: ConversationStatus,
  aiConfidence: number,
  threshold: number,
): boolean {
  // 只在特定状态下才自动处理
  const autoProcessable: ConversationStatus[] = [
    "new",
    "ai_processing",
    "ai_replied",
  ];

  return autoProcessable.includes(status) && aiConfidence >= threshold;
}

/**
 * 判断是否需要升级到人工
 */
export function needsEscalation(
  status: ConversationStatus,
  aiConfidence: number,
  threshold: number,
  sentiment: string,
): boolean {
  // 低置信度
  if (
    autoProcessableStatus(status) &&
    aiConfidence < threshold
  ) {
    return true;
  }

  // 负面情绪
  if (sentiment === "negative") {
    return true;
  }

  return false;
}

function autoProcessableStatus(status: ConversationStatus): boolean {
  return ["new", "ai_processing", "ai_replied"].includes(status);
}
