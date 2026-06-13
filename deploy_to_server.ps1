# ECS API 一键部署脚本
# 在你的 Windows PowerShell 里粘贴运行

$ip = "39.96.12.12"
$pass = "Hyqnan2009@"

Write-Host "=== 1/4 连接服务器 ===" -ForegroundColor Green
ssh -o StrictHostKeyChecking=no root@$ip "echo '服务器连接成功' && cat /etc/os-release | head -2"

Write-Host "`n=== 2/4 安装 Docker ===" -ForegroundColor Green
ssh root@$ip "curl -fsSL https://get.docker.com | sh && systemctl enable docker && systemctl start docker"

Write-Host "`n=== 3/4 部署 API ===" -ForegroundColor Green
ssh root@$ip "git clone https://github.com/Open-4/ecommerce-cs-platform.git /opt/ecs && cd /opt/ecs/deploy && docker build -t ecs-api ."

Write-Host "`n=== 4/4 启动服务 ===" -ForegroundColor Green
ssh root@$ip "docker run -d --name ecs-api --restart always -p 80:4000 -e DATABASE_URL='postgresql://postgres:zvIVYDbUiYFmOOQkYRhbEeNZENWVYrvy@acela.proxy.rlwy.net:50296/railway' -e DEEPSEEK_API_KEY='sk-cc6d64f978164dc593beded983d74020' -e JWT_SECRET='ae165b55a0391bd1d7d004da018da7f5283333b137d0630aa870d142ebd43cad' -e NODE_ENV='production' ecs-api"

Write-Host "`n=== 完成! ===" -ForegroundColor Green
Write-Host "API 地址: http://$ip/api/v1/health" -ForegroundColor Cyan
ssh root@$ip "sleep 5 && curl -s http://localhost/api/v1/health"
