# 标准化层说明

本目录预留给后续真实接入后的标准化逻辑。

未来建议按模块拆分：

- `overview-normalizer`
- `product-performance-normalizer`
- `order-normalizer`
- `traffic-normalizer`
- `ads-normalizer`

当前阶段不硬写标准化代码，原因是：

- 业务接口尚未验证
- 原始字段名尚未稳定
- 不能在字段未知时先写死映射逻辑
