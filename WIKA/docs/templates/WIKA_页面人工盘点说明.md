# WIKA 页面人工盘点说明

## 目标
- 当前没有稳定的页面行为级真实数据源，因此先把人工盘点做成正式输入层。
- 该输入层服务于内容与页面优化建议，不冒充官方行为数据。

## 支持的输入格式
- `WIKA_页面人工盘点模板.csv`
- `WIKA_页面人工盘点模板.json`
- JSON 口径要求：
  - 顶层为数组
  - 或顶层对象包含 `rows`
  - 每一行对象字段名必须与模板列一致

## 支持的输入格式
- `WIKA_页面人工盘点模板.csv`
- `WIKA_页面人工盘点模板.json`
- JSON 口径要求：
  - 顶层为数组
  - 或顶层对象包含 `rows`
  - 每一行对象字段名必须与模板列一致

## 最低必填字段
- `audit_date`
- `page_type`
- `page_url`
- `module_name`
- `observed_issue`
- `manual_recommendation`
- `priority`

## 建议补充字段
- `module_position`
- `homepage_module`
- `banner_status`
- `core_product_exposure`
- `category_entry_status`
- `contact_entry_status`
- `inquiry_entry_status`
- `main_image_status`
- `video_status`
- `detail_content_status`
- `owner`
- `evidence_link`
- `notes`

## 页面盘点范围
- 首页模块
- 主 banner
- 核心商品露出
- 重点类目入口
- 联系方式 / 询盘入口
- 主图 / 视频 / 详情内容完整度
- 当前观察问题
- 当前人工建议

## 状态值建议
- `YES`
- `NO`
- `PARTIAL`
- `UNKNOWN`

## 字段解释
- `audit_date`
  盘点日期。
- `page_type`
  建议值：`homepage`、`product_detail`、`landing_page`、`category_page`、`other`。
- `page_url`
  当前盘点页面 URL。
- `module_name`
  页面模块名称。
- `module_position`
  模块序号或位置说明。
- `homepage_module`
  是否属于首页模块，建议填 `YES/NO`。
- `banner_status`
  主 banner 当前状态。
- `core_product_exposure`
  是否有核心商品露出。
- `category_entry_status`
  是否存在重点类目入口。
- `contact_entry_status`
  联系方式入口是否清晰。
- `inquiry_entry_status`
  询盘入口是否清晰。
- `main_image_status`
  主图质量与完整度状态。
- `video_status`
  视频内容是否存在且有效。
- `detail_content_status`
  详情内容是否完整。
- `observed_issue`
  当前人工观察到的问题。
- `manual_recommendation`
  当前人工建议动作。
- `priority`
  建议值：`P0`、`P1`、`P2`。
- `owner`
  建议负责人。
- `evidence_link`
  截图、录屏或说明材料链接。
- `notes`
  补充说明。

## 进入 WIKA 的方式
- 当前模板先进入：
  - `WIKA/projects/wika/data/content-optimization/page-audit-contract.js`
- 标准化后会增强：
  - 内容与页面优化建议层
  - 首页优化建议
  - 主图 / 视频 / 详情整改建议
  - 后续统一输入总览层

## 结论增强边界
- 进入系统后，可以把“页面怎么改”的建议从纯保守推断，升级为“保守推断 + 人工现场盘点”的组合建议。
- 仍不能把它写成真实页面点击行为或热图结论。

## 当前边界
- manual audit input only
- not official behavior analytics
- conservative recommendation strengthened by human audit
- no write action attempted
