# 从 WIKA 复制到 XD 的业务数据层迁移说明

## 直接可复制的内容

- `overview/` 模块结构
- `products/` 模块结构
- `reports/` 模板结构
- `recommendations/` 规则结构
- `source-priority-plan.md`

## 必须替换的内容

- 账号标识
- token 存储路径
- XD 的实际数据源验证记录
- XD 的模块状态

## 不允许复制的内容

- WIKA 的真实 token
- WIKA 的真实运行状态
- WIKA 的真实验证结论

## 建议复制顺序

1. 复制目录结构
2. 替换账号名
3. 先验证 access 层
4. 再验证 overview
5. 再验证 products
6. 最后补 orders / ads
