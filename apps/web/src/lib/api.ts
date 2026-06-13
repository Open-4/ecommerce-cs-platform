/** API 客户端 - 与后端 NestJS 通信 */

// 本地开发用 localhost，线上用阿里云服务器
const BASE_URL = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:4000/api/v1"
  : "http://39.96.12.12/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("ecs_token")
    : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new ApiError(response.status, error.message ?? "Request failed");
  }

  return response.json();
}

// ---- Auth ----

export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<{ merchant: unknown; token: string }>("/auth/login", {
      method: "POST",
      body: data,
    }),
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    request<{ merchant: unknown; token: string }>("/auth/register", {
      method: "POST",
      body: data,
    }),
};

// ---- Merchant ----

export const merchantApi = {
  getProfile: () => request("/merchant/profile"),
  listShops: () => request("/merchant/shops"),
  addShop: (data: { platform: string; platformShopId: string; shopName: string }) =>
    request("/merchant/shops", { method: "POST", body: data }),
};

// ---- Conversations ----

export const conversationApi = {
  list: (params: { shopId: string; status?: string; page?: number; keyword?: string }) =>
    request("/conversations", { method: "GET" }),
  get: (id: string) => request(`/conversations/${id}`),
  updateStatus: (id: string, status: string) =>
    request(`/conversations/${id}/status`, { method: "POST", body: { status } }),
  markRead: (id: string) =>
    request(`/conversations/${id}/read`, { method: "POST" }),
  assign: (id: string, userId: string) =>
    request(`/conversations/${id}/assign`, { method: "POST", body: { userId } }),
};
