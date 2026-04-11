# callback / redirect_uri 配置规则

## 核心原则

平台后台配置的 callback URL 与服务实际使用的 `redirect_uri` 必须完全一致。

完全一致的含义包括：

- 协议一致
- 域名一致
- 路径一致
- 大小写一致
- 不能一个带尾斜杠、一个不带

## 必须同步检查的位置

- 平台开放应用后台里的 callback URL
- 服务端环境变量 `ALIBABA_REDIRECT_URI`
- 授权链接生成逻辑中的 `redirect_uri`
- 测试文档 / 接入记录里的示例地址

## 常见错误写法

- 平台后台是正式域名，代码里还是测试域名
- callback URL 是 `https`，实际授权链接里写成了 `http`
- 平台后台改了地址，但 Railway Variables 没同步
- 授权页使用了旧链接，导致 state 或 code 回到错误环境

## 常见报错来源

如果授权页打不开或直接失败：

- 先查 `client_id`
- 再查 `redirect_uri`
- 再查授权地址是否正确

如果 callback 没命中：

- 先查 callback URL 和 redirect_uri 一致性
- 再查域名解析和 HTTPS 是否可用
- 再查是否把旧环境的授权链接拿来复用了

## 修改 callback 时的标准动作

1. 修改平台后台 callback URL
2. 同步修改 `ALIBABA_REDIRECT_URI`
3. 重新验证 `/auth/start`
4. 确认 302 的 `Location` 中 redirect_uri 已更新
5. 重新走一次真实授权闭环
