# ECS - 多平台电商智能客服中台

AI 驱动的电商客服中台，覆盖淘宝/天猫 + 抖音。自动接待、智能导购、降低退款。

## 线上演示

https://out-qguhb0vax-heyiquan-s-projects.vercel.app

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + Fastify + Drizzle ORM |
| 数据库 | PostgreSQL 16 + pgvector（向量检索） |
| 缓存 | Redis |
| AI | Claude API (主) + GPT-4o (备) |
| 部署 | Vercel (前端) + Railway/Docker (后端) |

---

## 快速部署（7 步上线）

### 前置条件

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose
- Claude API Key（https://console.anthropic.com）
- GitHub 账号
- Railway 账号（https://railway.app）或一台 Linux 服务器

### 第 1 步：克隆仓库

```bash
git clone https://github.com/你的用户名/ecommerce-cs-platform.git
cd ecommerce-cs-platform
```

### 第 2 步：配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入：
#   CLAUDE_API_KEY=sk-ant-xxxxx    （必填）
#   JWT_SECRET=随机字符串           （必填）
#   DB_PASSWORD=强密码              （必填）
```

### 第 3 步：本地启动（验证）

```bash
pnpm install
docker compose up -d          # 启动 PostgreSQL + Redis + MinIO
pnpm db:push                   # 创建数据库表
pnpm dev                       # 启动 API (:4000) + 前端 (:3000)
```

访问 http://localhost:3000 查看效果。

### 第 4 步：部署后端到 Railway

**方式 A：Railway 一键部署（推荐）**

1. 把仓库推到 GitHub
2. 打开 [Railway.app](https://railway.app) → New Project → Deploy from GitHub
3. 选择本仓库，Railway 自动读取 `railway.json` 配置
4. 添加 PostgreSQL 和 Redis 插件
5. 在 Variables 中设置环境变量（参考 .env.production）
6. 部署完成后获得 API 域名，如 `https://ecs-api.up.railway.app`

**方式 B：Docker 部署到任意服务器**

```bash
# 在服务器上
git clone https://github.com/你的用户名/ecommerce-cs-platform.git
cd ecommerce-cs-platform
cp .env.production .env
# 编辑 .env 填入真实值
docker compose -f docker-compose.prod.yml up -d
```

### 第 5 步：部署前端到 Vercel

1. 把仓库推到 GitHub
2. 打开 [Vercel.com](https://vercel.com) → New Project → Import 本仓库
3. Root Directory 设置为 `apps/web`
4. 环境变量添加 `NEXT_PUBLIC_API_URL=https://你的API域名/api/v1`
5. Deploy

### 第 6 步：配置电商平台

**淘宝开放平台：**
1. 访问 https://open.taobao.com → 创建应用
2. 获取 AppKey 和 AppSecret
3. 在 Railway 环境变量中设置 `TAOBAO_APP_KEY` 和 `TAOBAO_APP_SECRET`
4. 配置 OAuth 回调地址为 `https://你的域名/api/v1/webhook/taobao/message`

**抖音开放平台：**
1. 访问 https://open.douyin.com → 创建应用
2. 获取应用凭证
3. 设置 `DOUYIN_APP_KEY` 和 `DOUYIN_APP_SECRET`

### 第 7 步：开始接收商家

1. 访问你的前端域名
2. 注册第一个商家账号
3. 走入驻向导完成配置
4. AI 客服开始运行

---

## 项目结构

```
ecommerce-cs-platform/
├── apps/web/              # Next.js 前端（11 个页面）
├── packages/
│   ├── shared/            # 共享类型、常量、工具
│   ├── core/              # 核心业务逻辑（状态机、风险评估）
│   ├── llm-gateway/       # LLM 网关（Claude + OpenAI + 安全护栏）
│   ├── adapters/
│   │   ├── base-adapter/  # 平台适配器抽象接口
│   │   └── taobao-adapter/# 淘宝适配器（400+ 行完整实现）
│   └── api/               # NestJS 后端（22 个 API 端点）
├── docker-compose.yml     # 开发环境
├── docker-compose.prod.yml# 生产环境
├── railway.json           # Railway 部署配置
└── .env.example           # 环境变量模板
```

## API 端点

| 模块 | 端点 | 方法 |
|------|------|------|
| Auth | `/api/v1/auth/register` | POST |
| Auth | `/api/v1/auth/login` | POST |
| Merchant | `/api/v1/merchant/profile` | GET |
| Merchant | `/api/v1/merchant/shops` | GET, POST |
| Conversations | `/api/v1/conversations` | GET |
| Conversations | `/api/v1/conversations/:id` | GET |
| Conversations | `/api/v1/conversations/:id/status` | POST |
| Knowledge | `/api/v1/knowledge` | GET, POST, PUT, DELETE |
| Knowledge | `/api/v1/knowledge/bulk` | POST |
| Webhook | `/api/v1/webhook/taobao/message` | POST |
| Webhook | `/api/v1/webhook/douyin/message` | POST |
| AI | `/api/v1/ai/process` | POST |
| AI | `/api/v1/ai/refund-decision` | POST |

## 定价

| 套餐 | 价格 | 适用 |
|------|------|------|
| 免费试用 | ¥0 / 14天 | 体验核心功能 |
| 标准版 | ¥299/月 | 月销 1000-5000 单 |
| 专业版 | ¥999/月 | 月销万单以上 |
| 企业版 | 定制 | 大品牌/私有化 |

## License

MIT
