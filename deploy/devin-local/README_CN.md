# Devin 版本的独立本地 Docker 部署

- 访问地址：<http://127.0.0.1:9201>
- Compose 项目：`sub2api-devin-local`
- 应用镜像：`local/sub2api-devin:20261020`
- 初始管理员邮箱：`.env` 中的 `ADMIN_EMAIL`。
- 初始密码：本目录 `.env` 中的 `ADMIN_PASSWORD`。

这是独立的新实例。它不复用已有 sub2api 的账号、数据库、Redis、数据目录或密钥。默认不会使用其他实例的 `8080` 或 `9200` 端口。

新实例只将 Web 服务绑定到本机 `127.0.0.1:9201`。数据库和 Redis 不向宿主机公开端口。

## 首次部署

将 `.env.example` 复制为 `.env`，替换所有占位符。两个加密密钥各使用独立的 64 位十六进制随机值（例如分别运行 `openssl rand -hex 32`）。不要将真实 `.env` 提交到 Git。

```bash
docker pull postgres:18-alpine
docker pull redis:8-alpine
docker compose -p sub2api-devin-local --env-file .env -f compose.yaml up -d --build
```

以上命令在本目录执行；首次运行前请确认 `9201` 端口和项目名未被占用。若要部署多个副本，请分别调整项目名和宿主机端口。

## 管理

在本目录打开 PowerShell：

```powershell
.\manage.ps1 status
.\manage.ps1 start
.\manage.ps1 stop
.\manage.ps1 restart
.\manage.ps1 logs
.\manage.ps1 rebuild
```

脚本固定使用本实例的 Compose 项目名、配置文件和 `.env`，不依赖终端当前目录。`stop` 保留数据。不要改用其他目录里的默认 Compose 配置来管理本实例。

## 数据保存

专用 Docker 数据卷：

- `sub2api-devin-local_app_data`
- `sub2api-devin-local_postgres_data`
- `sub2api-devin-local_redis_data`

专用网络：`sub2api-devin-local_default`。

`.env` 保存本实例的管理员初始密码、数据库密码、Redis 密码和加密密钥。它已被 Git 和 Docker 构建上下文忽略，请保留该文件以便重建和重启。

## Devin 登录

首次登录需要你阅读并确认项目内置的管理员使用须知；确认前，后台业务接口会返回 `ADMIN_COMPLIANCE_ACK_REQUIRED`。部署过程没有代为确认。

完成后，按项目 `docs/DEVIN_CN.md` 创建 Devin 分组和账号并完成授权。容器中的 `127.0.0.1` 指容器自己；如需使用 Windows 上的网络代理，应在后台配置 `host.docker.internal` 和实际代理端口。

## Google OAuth 配置

公开版本不包含上游内置的 Google OAuth 客户端凭据。Devin OAuth 不需要这些配置。
使用 Antigravity 时请设置 `ANTIGRAVITY_OAUTH_CLIENT_ID` 和 `ANTIGRAVITY_OAUTH_CLIENT_SECRET`；使用 Gemini CLI / Code Assist / Google One 时请设置 `GEMINI_CLI_OAUTH_CLIENT_ID` 和 `GEMINI_CLI_OAUTH_CLIENT_SECRET`。需要使用获准支持相应服务和 scopes 的客户端凭据；普通新建的 Google 客户端不保证能访问这些服务。

独立 Docker 配置已传递上述可选环境变量；请将真实值保存在 `.env`，不要提交到 Git。AI Studio 仍可使用项目原有的自定义 OAuth 客户端配置。
