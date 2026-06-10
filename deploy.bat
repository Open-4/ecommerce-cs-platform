@echo off
echo ============================================
echo   ECS Platform - Railway 一键部署
echo ============================================
echo.

cd /d %~dp0

echo [1/3] 提交最新代码...
git add -A
git commit -m "Deploy: Railway production" 2>nul
git push origin master
echo 代码已推送！
echo.

echo [2/3] 在浏览器打开 Railway 项目设置...
echo.
echo 请打开这个地址：
echo https://railway.app/project/ed4be49b-7d97-495e-87f1-a31c8c8de412/service/1ad18813-7f5d-406d-9b0b-c7c5e93c079f/settings
echo.
echo 在 Settings 页面：
echo   1. 找到 Build Command，改成: pnpm install --frozen-lockfile
echo   2. 找到 Start Command，改成: pnpm start
echo.
echo [3/3] 检查 Variables 是否包含以下变量：
echo   DB_HOST=postgres.railway.internal
echo   DB_PORT=5432
echo   DB_USER=postgres
echo   DB_NAME=railway
echo   REDIS_URL=redis://redis.railway.internal:6379
echo   DEEPSEEK_API_KEY=sk-cc6d64f978164dc593beded983d74020
echo   JWT_SECRET=ae165b55a0391bd1d7d004da018da7f5283333b137d0630aa870d142ebd43cad
echo.
echo 设置完成后，点右上角 Deploy 按钮！
echo ============================================
pause
