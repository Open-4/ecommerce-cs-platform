import type {
  ILLMProvider,
  LLMRequest,
  LLMResponse,
  LLMMessage,
  LLMProviderConfig,
} from "./base";

// ============================================================
// Claude (Anthropic) Provider
// ============================================================

export class ClaudeProvider implements ILLMProvider {
  readonly name = "claude";
  readonly defaultModel: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1";
    this.defaultModel = config.defaultModel ?? "claude-sonnet-4-6";
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = request.model ?? this.defaultModel;

    // 提取 system 消息（Anthropic API 要求 system 放在顶层）
    const systemMessages = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content);
    const chatMessages = request.messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      messages: chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.join("\n\n");
    }

    if (request.stopSequences?.length) {
      body.stop_sequences = request.stopSequences;
    }

    const response = await this.fetchWithRetry("/messages", body);
    const data = (await response.json()) as Record<string, unknown>;
    const latencyMs = Date.now() - startTime;

    const content = this.extractTextContent(data);
    const usage = this.extractUsage(data);

    return {
      content,
      model: (data.model as string) ?? model,
      usage,
      finishReason: this.mapFinishReason(
        (data.stop_reason as string) ?? "end_turn",
      ),
      latencyMs,
    };
  }

  async *chatStream(request: LLMRequest): AsyncIterable<string> {
    const model = request.model ?? this.defaultModel;

    const systemMessages = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content);
    const chatMessages = request.messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      messages: chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.join("\n\n");
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `Claude API error: ${response.status} ${await response.text()}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta") {
              yield parsed.delta?.text ?? "";
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ---- Private helpers ----

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  private async fetchWithRetry(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (response.ok) return response;

        // 4xx 不重试
        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `Claude API error: ${response.status} ${await response.text()}`,
          );
        }

        // 5xx 或 429 重试
        lastError = new Error(
          `Claude API error: ${response.status} Retry ${attempt}/${this.maxRetries}`,
        );
      } catch (err) {
        lastError = err as Error;
      }

      if (attempt < this.maxRetries) {
        await new Promise((r) =>
          setTimeout(r, Math.pow(2, attempt) * 1000),
        );
      }
    }

    throw lastError ?? new Error("Unknown fetch error");
  }

  private extractTextContent(data: Record<string, unknown>): string {
    const content = data.content as Array<Record<string, unknown>> | undefined;
    if (!content) return "";

    return content
      .filter((block) => block.type === "text")
      .map((block) => (block.text as string) ?? "")
      .join("\n");
  }

  private extractUsage(data: Record<string, unknown>): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  } {
    const usage = data.usage as Record<string, number> | undefined;
    return {
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      cacheReadTokens: usage?.cache_read_input_tokens,
      cacheWriteTokens: usage?.cache_creation_input_tokens,
    };
  }

  private mapFinishReason(
    reason: string,
  ): LLMResponse["finishReason"] {
    switch (reason) {
      case "end_turn":
        return "stop";
      case "max_tokens":
        return "length";
      case "stop_sequence":
        return "stop";
      case "content_filter":
        return "content_filter";
      default:
        return "stop";
    }
  }
}
