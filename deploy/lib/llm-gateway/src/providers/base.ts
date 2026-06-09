// ============================================================
// LLM Provider 抽象基类
// ============================================================

/** LLM 消息角色 */
export type LLMRole = "system" | "user" | "assistant";

/** LLM 消息 */
export interface LLMMessage {
  role: LLMRole;
  content: string;
}

/** LLM 请求参数 */
export interface LLMRequest {
  messages: LLMMessage[];
  /** 模型名称，如 claude-sonnet-4-6 */
  model?: string;
  /** 温度 (0-1) */
  temperature?: number;
  /** 最大输出 token */
  maxTokens?: number;
  /** JSON Schema 约束输出 */
  responseSchema?: Record<string, unknown>;
  /** 停止词 */
  stopSequences?: string[];
}

/** LLM 使用量 */
export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  cost?: number; // USD
}

/** LLM 响应 */
export interface LLMResponse {
  content: string;
  /** 结构化输出（如果传了 responseSchema） */
  structuredOutput?: Record<string, unknown>;
  model: string;
  usage: LLMUsage;
  finishReason: "stop" | "length" | "content_filter" | "tool_use";
  latencyMs: number;
}

/** LLM Provider 抽象接口 */
export interface ILLMProvider {
  readonly name: string;
  readonly defaultModel: string;

  /** 发送聊天请求 */
  chat(request: LLMRequest): Promise<LLMResponse>;

  /** 流式聊天 */
  chatStream(request: LLMRequest): AsyncIterable<string>;

  /** 检查是否可用 */
  isAvailable(): Promise<boolean>;
}

/** Provider 配置 */
export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeoutMs?: number;
}
