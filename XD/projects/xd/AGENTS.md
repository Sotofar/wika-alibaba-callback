# XD project AGENTS

## 目录用途
- `projects/xd` 只用于承接 XD 的标准权限验证、覆盖矩阵和权限缺口说明。
- 这里不存放 WIKA 的任何真实业务数据或敏感配置。

## 可执行命令
- `node scripts/validate-access-stability-stage20.js`
- `node --check scripts/validate-access-stability-stage20.js`

## 约束与禁区
- 先走标准权限逐项验证，不做高权限盲扫。
- 只有显式允许时才做单接口高权限补测。
- 不做平台内写动作，不复用 WIKA token、cookie、响应正文或账号标识。

## 完成标准
- XD `api_matrix.csv`、`api_coverage.md`、`permission_gap.md` 已更新。
- 每个结论都有对应的 WIKA 未决来源或当前 precheck 证据。
