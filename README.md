# WIKA Alibaba Callback

## 项目用途

本项目是一个独立的最小后端服务，用于接收 Alibaba OAuth 回调请求，适合部署到 Railway。

当前版本只做最小可用验证：

- 提供健康检查接口
- 接收 Alibaba 回调中的 `code`、`state` 和其他 query 参数
- 在服务日志中打印回调参数
- 返回简单 HTML 页面确认回调已到达

当前版本**不负责**把 `code` 换成 token，也**不负责**数据库持久化。

## 接口说明

### `GET /health`

- 返回状态码：`200`
- 返回内容：`ok`

### `GET /integrations/alibaba/callback`

- 支持接收 `code`、`state` 以及其他 query 参数
- 当缺少 `code` 时，返回 `400` 和文本：`Missing code`
- 当存在 `code` 时：
  - 在服务日志中打印 `code`、`state`、完整 query
  - 返回一个简单 HTML 页面，提示 `Alibaba authorization received`

## 本地启动步骤

1. 进入项目目录。
2. 安装依赖：

```bash
npm install
```

3. 启动服务：

```bash
npm start
```

4. 本地验证：

```bash
http://localhost:3000/health
http://localhost:3000/integrations/alibaba/callback
http://localhost:3000/integrations/alibaba/callback?code=test-code&state=test-state
```

## Railway 部署步骤

1. 将代码推送到 GitHub 仓库。
2. 打开 Railway Dashboard。
3. 点击 `New Project`。
4. 选择 `Deploy from GitHub repo`。
5. 连接该仓库并部署。
6. 部署完成后，在服务 `Settings / Networking` 中先生成 Railway 域名。
7. 先测试 Railway 域名下：
   - `/health`
   - `/integrations/alibaba/callback`
8. 再添加自定义域名：
   - `api.wikapacking.com`
9. 按 Railway 给出的 CNAME 到域名 DNS 服务商处添加记录。
10. 等待 Railway 校验通过与 SSL 生效。
11. 再测试：
   - `https://api.wikapacking.com/health`
   - `https://api.wikapacking.com/integrations/alibaba/callback`

## 自定义域名绑定步骤

1. 在 Railway 项目中打开目标服务。
2. 进入 `Settings` 或 `Networking`。
3. 添加自定义域名：`api.wikapacking.com`。
4. Railway 会提供一个目标域名，通常是 `*.up.railway.app`。
5. 到 DNS 服务商后台为 `api` 子域名添加 `CNAME` 记录，指向 Railway 提供的目标域名。
6. 等待 DNS 生效。
7. 等待 Railway 完成域名校验和 SSL 证书签发。

## DNS 说明

- 自定义域名通常需要把 `api` 子域名做成 `CNAME`，指向 Railway 提供的 `*.up.railway.app` 目标。
- 在 DNS 还没生效前，自定义域名可能打不开。
- SSL 签发不是瞬间完成的，需等待平台验证完成。

## Alibaba 回调注意事项

- 在 Alibaba 开放平台后台配置的 callback URL 必须与实际使用的 `redirect_uri` 保持一致。
- 本项目当前只负责接收 `code`。
- 收到 `code` 后，下一步再对接换 token 逻辑。

建议在 Alibaba 后台将 callback URL 配置为：

```text
https://api.wikapacking.com/integrations/alibaba/callback
```

## 验证步骤

### 1. 健康检查

访问：

```text
/health
```

预期：

- 状态码 `200`
- 返回 `ok`

### 2. 缺少 code 的回调

访问：

```text
/integrations/alibaba/callback
```

预期：

- 状态码 `400`
- 返回 `Missing code`

### 3. 带 code 的回调

访问：

```text
/integrations/alibaba/callback?code=test-code&state=test-state
```

预期：

- 状态码 `200`
- 页面显示 `Alibaba authorization received`
- 服务日志打印收到的 `code`、`state`、完整 query

## 常见故障排查

### Railway 部署成功但打不开

- 检查服务是否已经成功发布
- 检查 Railway 是否已经分配域名
- 检查服务日志是否有启动失败信息

### 自定义域名打不开

- 检查 `api.wikapacking.com` 是否已经添加正确的 `CNAME`
- 检查 DNS 是否已生效
- 检查 Railway 域名验证是否通过
- 检查 SSL 是否已经签发完成

### `/health` 访问失败

- 检查服务是否监听了 `process.env.PORT`
- 检查 `start` 脚本是否为 `node app.js`
- 检查是否误改了 Railway 默认启动命令

### Alibaba 回调没有命中

- 检查 Alibaba 后台 callback URL 是否与实际 `redirect_uri` 完全一致
- 检查是否仍然使用旧的测试回调地址
- 检查域名和 SSL 是否已完全生效
- 检查 Railway 日志里是否收到对应请求
