# Devin OAuth 与模型调用接入

原始本地开发分支：`feat/devin-oauth`；公开仓库使用 `main` 分支。

## 本次实现

- 管理后台创建账号时可选择 **Devin**，通过浏览器登录、复制授权码完成授权；支持重新授权。
- PKCE S256、随机 state、10 分钟 Redis 授权会话、跨实例一次性兑换；授权阶段使用账号选定的代理。
- 获取并保存 Devin 会话令牌和可用的用户资料。会话令牌没有 refresh token，不参与其他平台的自动刷新；失效后重新授权。
- 直接请求 Devin 的 Connect-RPC 推理服务，不需要运行 CLIProxyAPI 旁路服务。
- 接入 sub2api 现有的 API Key 鉴权、Devin 分组、账号调度和用量处理；提供 `/v1/chat/completions`、`/v1/responses`、`/v1/messages` 的流式及非流式调用。
- 支持文本、内联 Base64 图片、函数工具调用及结果回传、思考文本、模型映射、模型清单和账号连接测试。
- 解析 Connect 帧、gzip 帧、UTF-8 跨帧文本、用量与错误终帧。中途断流不输出成功终态；上游错误正文不向客户端暴露。

## 使用步骤

1. 按项目原有部署说明启动 PostgreSQL、Redis 和 sub2api；本功能不需要新增数据库迁移或 OAuth 客户端配置。
2. 在管理后台创建平台为 **Devin** 的分组，并配置需要使用的模型价格。
3. 在「账号管理 → 添加账号」选择 **Devin**，填写名称、代理和分组。
4. 进入授权步骤，点击「生成 Devin 授权链接」。在新窗口打开链接，登录并授权，然后复制页面显示的授权码。
5. 将授权码粘贴回 sub2api，点击「完成授权」。也可粘贴包含 code 和 state 的完整回调 URL；校验由后端完成。
6. 使用账号的「测试」操作验证连接。为调用方创建绑定 Devin 分组的 sub2api API Key。

示例请求（将地址和密钥替换为实际值）：

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer YOUR_SUB2API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"swe-2","messages":[{"role":"user","content":"请回复 OK"}],"stream":true}'
```

Responses 请求使用 `{"model":"swe-2","input":"请回复 OK","stream":true}`。
Messages 请求使用 `{"model":"swe-2","max_tokens":128,"messages":[{"role":"user","content":"请回复 OK"}]}`。

## 构建与验证

使用项目 `backend/go.mod` 指定的 Go 版本（当前为 1.27.2）；本机 Go 自动下载了相应工具链。前端依赖使用 pnpm 10 安装，以兼容仓库现有锁文件配置。

```bash
cd frontend
npx --yes pnpm@10.28.2 install --frozen-lockfile
npx --yes pnpm@10.28.2 build
cd ../backend
go build -tags embed -o sub2api ./cmd/server
```

Windows 可将输出名改为 `sub2api.exe`。`-tags embed` 会嵌入前一步生成的前端资源；数据库、Redis 及服务配置仍按项目原有文档设置。

本次验证包含：

- 后端 Devin 授权、协议编解码、错误处理、模型平台登记及六种网关调用组合的测试。
- 前端授权状态管理、创建账号完整交互、平台列表与中英文翻译完整性测试，以及原有创建账号/Grok 相关回归测试。
- 前端类型检查、生产构建和后端编译。

后端相关测试可执行：

```bash
go test -p=1 -tags=unit ./internal/pkg/devin ./internal/domain ./internal/service ./internal/repository ./internal/handler/admin ./internal/server/routes -run 'TestDevin|TestPlatformList|TestPlatformsReturnsCopy' -count=1
```

测试使用模拟上游和 Redis 测试服务；未使用真实 Devin 账号进行在线授权或付费推理，也未执行需要真实 PostgreSQL 环境的全量集成测试。

## 当前边界

- 内置模型清单来自参考仓库的固定版本。实际可用模型和额度以 Devin 账号为准；本次没有增加远程模型目录自动更新或 Devin 配额查询面板。
- 多轮调用需要发送完整会话历史，不支持仅用 `previous_response_id` 恢复服务端历史。
- 图片必须使用 `data:image/...;base64,...`，不抓取远程图片 URL；不支持音频、视频、图片生成。
- 当前支持 `n=1`、`tool_choice=auto/none`；结构化输出、强制工具选择、stop、logprobs 和旧版 functions 参数会返回明确错误。
- 请求采用独立上游会话，未移植 CLIProxyAPI 的跨请求缓存会话与完整签名恢复机制。复杂工具链、依赖签名的思考历史和具体模型兼容性仍应使用实际账号验证。
- 会话令牌需保密。Devin 服务撤销令牌后，在账号菜单选择「重新授权」。

## 参考与许可证

- sub2api 基线：[Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api)，提交 `8f2cbb53d9d1c40e1865b07ac460571f7d4c48de`。
- Devin OAuth 和协议参考：[router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)，提交 `ae3ee3be303fb07fb8173279923413005bf32177`。
- `backend/internal/pkg/devin/wire.go`、`models.go` 和 `models.json` 改编自上述参考项目；MIT 许可及版权声明保存在同目录 `LICENSE.cliproxyapi`。其余集成代码遵循 sub2api 的项目许可。
