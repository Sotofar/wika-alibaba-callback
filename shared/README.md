# Alibaba-Shared-Ops

这是阿里国际站运营共享中台，只存放可复用的方法、规则、模板和 SOP。

## 放在这里的内容

- 后台权限获取标准
- 选品逻辑
- 关键词研究方法
- 广告投放框架
- 标题 / 主图 / 详情页优化规则
- 询盘质量判断标准
- 周报 / 月报模板
- 巡检 SOP
- 竞品监控 SOP

## 不要放在这里的内容

- WIKA 专属数据
- XD 专属数据
- 任一账号的真实 `secret / token`
- 任一账号的预算建议
- 任一账号的结论性报表

## 项目组调用方式

- WIKA 只读取这里的方法，业务输出写入 `WIKA/` 对应目录。
- XD 只读取这里的方法，业务输出写入 `XD/` 对应目录。
- truly shared / common 内容继续保留在根目录、`shared/`、`src/` 或明确的 common 区域。

## 入口

- [shared/access/README.md](./access/README.md)
