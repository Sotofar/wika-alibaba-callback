# Alibaba-WIKA-Ops

本目录只处理 WIKA 国际站账号对应的数据、结论和材料。

## 目录职责

- `access/`：接入、授权、token、接口验证记录
- `store-diagnosis/`：店铺诊断结论
- `product-analysis/`：产品表现分析
- `keyword-analysis/`：关键词相关结论
- `ads/`：广告诊断与优化材料
- `listing-optimization/`：标题、主图、详情页优化建议
- `inquiries/`：询盘分析与跟进建议
- `reports/`：日报、周报、月报等
- `action-items/`：动作清单与优先级

## 调用规则

- 通用基础设施继续引用根目录 `shared/`
- WIKA 业务输出只落在 `WIKA/projects/wika/`
- 不复用 XD 的业务数据文件
