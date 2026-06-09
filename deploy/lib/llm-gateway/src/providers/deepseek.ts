import type {
  ILLMProvider,
  LLMRequest,
  LLMResponse,
  LLMProviderConfig,
} from "./base.js";

// ============================================================
// DeepSeek Provider (OpenAI 兼容)
// ============================================================

export class DeepSeekProvider implements ILLMProvider {
  readonly name = "deepseek";
  readonly defaultModel: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.deepseek.com/v1";
    this.defaultModel = config.defaultModel ?? "deepseek-chat";
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = request.model ?? this.defaultModel;

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (request.responseSchema) {
      body.response_format = {
        type: "json_object",
      };
    }

    if (request.stopSequences?.length) {
      body.stop = request.stopSequences;
    }

    const response = await this.fetchWithRetry("/chat/completions", body);
    const data = (await response.json()) as Record<string, unknown>;
    const latencyMs = Date.now() - startTime;

    const choices = data.choices as Array<Record<string, unknown>> | undefined;
    const firstChoice = choices?.[0];
    const message = firstChoice?.message as Record<string, unknown> | undefined;
    const content = (message?.content as string) ?? "";

    const usage = data.usage as Record<string, number> | undefined;

    return {
      content,
      model: (data.model as string) ?? model,
      usage: {
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
      },
      finishReason: this.mapFinishReason(
        (firstChoice?.finish_reason as string) ?? "stop",
      ),
      latencyMs,
    };
  }

  async *chatStream(request: LLMRequest): AsyncIterable<string> {
    const model = request.model ?? this.defaultModel;

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `DeepSeek API error: ${response.status} ${await response.text()}`,
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
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // 跳过
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
      Authorization: `Bearer ${this.apiKey}`,
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

        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `DeepSeek API error: ${response.status} ${await response.text()}`,
          );
        }

        lastError = new Error(
          `DeepSeek API error: ${response.status} Retry ${attempt}/${this.maxRetries}`,
        );
      } catch (err) {
        lastError = err as Error;
      }

      if (attempt < this.maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError ?? new Error("Unknown fetch error");
  }

  private mapFinishReason(
    reason: string,
  ): LLMResponse["finishReason"] {
    switch (reason) {
      case "stop":
        return "stop";
      case "length":
        return "length";
      case "content_filter":
        return "content_filter";
      default:
        return "stop";
    }
  }
}
