# WIKA project AGENTS

## 目录用途
- `projects/wika` 只记录 WIKA 的真实接入、验证、诊断和交接产物。
- 这里允许沉淀复跑矩阵、未决队列、验证摘要和只读证据。

## 可执行命令
- `node scripts/validate-access-stability-stage20.js`
- `node --check app.js`
- `node --check scripts/validate-access-stability-stage20.js`

## 约束与禁区
- 只复用 Railway production + `/sync + access_token + sha256` 主线。
- 不写入真实业务数据，不做平台内写动作。
- 不保存明文 token、cookie、secret。
- 不把候选验证或草稿层误写成平台内闭环。

## 完成标准
- WIKA 复跑矩阵、摘要、未决队列已更新。
- 所有结论可追溯到脚本、文档或脱敏证据。
