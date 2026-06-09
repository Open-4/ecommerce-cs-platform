# Railway 部署指南 - 第 2 步操作

## 你需要做的（5 分钟）

### Step 1: 打开 Railway

访问 https://railway.app → 用 GitHub 登录

### Step 2: 创建项目

1. 点 **New Project** → **Deploy from GitHub**
2. 如果没看到仓库，点 **Configure GitHub** → 授权 `Open-4/ecommerce-cs-platform`
3. 选择 `Open-4/ecommerce-cs-platform` 仓库
4. Railway 会自动开始部署（可能会失败，正常，先加插件）

### Step 3: 添加 PostgreSQL 和 Redis

在项目页面右侧：
1. 点 **+ New** → **Database** → **Add PostgreSQL**
2. 再点 **+ New** → **Database** → **Add Redis**
3. 等待两个插件状态变为 ✓ Healthy

### Step 4: 添加环境变量

在项目页面点 **Variables** → **+ New Variable**，逐个添加：

| 变量名 | 值（复制粘贴） |
|--------|---------------|
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `ae165b55a0391bd1d7d004da018da7f5283333b137d0630aa870d142ebd43cad` |
| `DB_HOST` | `${{Postgres.DATABASE_HOST}}` |
| `DB_PORT` | `${{Postgres.DATABASE_PORT}}` |
| `DB_USER` | `${{Postgres.DATABASE_USER}}` |
| `DB_PASSWORD` | `${{Postgres.DATABASE_PASSWORD}}` |
| `DB_NAME` | `${{Postgres.DATABASE_NAME}}` |
| `REDIS_URL` | `${{Redis.DATABASE_URL}}` |
| `CLAUDE_API_KEY` | ⚠️ 替换为你的 Claude API Key |
| `FRONTEND_URL` | `https://out-he1kcg8g7-heyiquan-s-projects.vercel.app` |

> **重要**：`${{Postgres.xxx}}` 和 `${{Redis.xxx}}` 是 Railway 的引用语法，
> 添加 PostgreSQL 和 Redis 插件后会自动可用。

### Step 5: 重新部署

1. 点 **Deployments** tab
2. 点右上角 **Deploy** 按钮（或点最新失败部署的 ... → **Redeploy**）
3. 等待 2-3 分钟

### Step 6: 获取 API 地址

部署成功后：
1. 点 **Settings** tab
2. 在 **Domains** 下能看到你的 API 地址
3. 格式类似：`https://ecs-api-production-xxxx.up.railway.app`

记下这个地址，第 3 步需要用到。

### Step 7: 初始化数据库

部署成功后，在 Railway 项目页面：
1. 点顶部的 **Command** 按钮（或 Shell 标签）
2. 输入并执行：
```bash
cd packages/api && npx drizzle-kit push
```
3. 看到 "Table created" 提示表示成功

---

## 获取 Claude API Key

如果你还没有 Claude API Key：
1. 访问 https://console.anthropic.com
2. 注册/登录 Anthropic 账号
3. 点 **API Keys** → **Create Key**
4. 复制 key（格式：`sk-ant-api03-xxxxx`）
5. 粘贴到 Railway Variables 的 `CLAUDE_API_KEY`

---

## 下一步

完成以上步骤后，告诉我你的 API 地址，我帮你：
- 把前端连到你的后端
- 测试注册/登录
- 测试 AI 回复功能
