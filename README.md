# 阿里国际站仓库说明

## 当前远端基线

- 当前远端 main 已锁定到 stage24。
- stage24 已完成目录重整、编码修复、路径修复、资产治理与最小 post-deploy 验证。
- 当前业务主线继续只推进 WIKA；XD 只保留目录归档与历史资料，不推进业务功能。

## 结构总览

- `WIKA/`
- `XD/`
- `shared/`
- `src/`
- `app.js`

## 目录用途

- `WIKA/`
  - WIKA 业务主线的文档、脚本、证据、项目资料与阶段沉淀
- `XD/`
  - XD 历史资料、目录归档与只读对照材料
- `shared/`
  - 可复用的通用规则、模板、SOP、说明文档与共享模块
- `src/`
  - 公共运行时与基础服务代码
- `app.js`
  - 当前服务主入口

## 当前目录边界

- 今后 WIKA 的业务工作、文档、脚本、证据、规划材料，只进入 `WIKA/` 对应目录。
- 今后 XD 的业务工作、文档、脚本、证据、规划材料，只进入 `XD/` 对应目录。
- truly shared / common 内容单独保留在根目录或 `shared/`、`src/`、`common/`，不再混放到 WIKA 或 XD 业务目录。

## 主要入口

- [WIKA/README.md](./WIKA/README.md)
- [XD/README.md](./XD/README.md)
- [WIKA_项目基线.md](./WIKA/docs/framework/WIKA_项目基线.md)
- [WIKA_执行计划.md](./WIKA/docs/framework/WIKA_执行计划.md)

## 当前工作规则

- 当前业务主线只推进 WIKA。
- XD 不推进新业务功能，不做新的 XD API 验证。
- 一律复用 Railway production 闭环与 Alibaba 官方 `/sync + access_token + sha256`。
- 所有中间进度、最终总结、验收结果、提交说明，一律使用简体中文输出。
