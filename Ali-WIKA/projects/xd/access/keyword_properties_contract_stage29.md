# XD keyword `properties` contract stage29

更新时间：2026-04-14

## 结论
- `alibaba.mydata.self.keyword.effect.week.get`
  - stage28 的真实阻塞是 `MissingParameter(properties)`。
  - stage29 通过官方文档页补齐了最小 `properties` 示例后，两次 live 调用都进入 `InsufficientPermission`。
  - 结论：当前不是 `properties` 缺失问题，已收口为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`。
- `alibaba.mydata.industry.keyword.get`
  - stage28 的真实阻塞是 `MissingParameter(properties)`。
  - stage29 通过官方文档页补齐了最小 `properties` 示例后，两次 live 调用都进入 `InsufficientPermission`。
  - 结论：当前不是 `properties` 缺失问题，已收口为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`。

## 证据来源
1. 仓内历史证据
   - [candidate_pool_stage28_continuous.md](D:/Code/阿里国际站/Ali-WIKA/projects/xd/access/candidate_pool_stage28_continuous.md)
   - [stage28-xd-continuous-closure.json](D:/Code/阿里国际站/docs/framework/evidence/stage28-xd-continuous-closure.json)
2. 官方文档页
   - `alibaba.mydata.self.keyword.effect.week.get`
   - `alibaba.mydata.industry.keyword.get`
3. stage29 live 验证
   - [validate-xd-stage29-final-closure.js](D:/Code/阿里国际站/scripts/validate-xd-stage29-final-closure.js)
   - [stage29-xd-candidate-final-closure.json](D:/Code/阿里国际站/docs/framework/evidence/stage29-xd-candidate-final-closure.json)

## 方法 1：`alibaba.mydata.self.keyword.effect.week.get`

### 当前已知最小参数集合
- 顶层必填：
  - `date_range`
  - `properties`
- `date_range` 已验证结构：
  - `start_date`
  - `end_date`
- 官方文档示例里的 `properties` 字段：
  - `keywords_in_use`
  - `keywords_viewed`
  - `offset`
  - `order_by_mode`
  - `limit`
  - `is_p4p`
  - `keyword`
  - `order_by_field`

### 本轮采用的最小 live 请求
```json
{
  "date_range": {
    "start_date": "2026-03-15",
    "end_date": "2026-04-13"
  },
  "properties": {
    "keywords_in_use": "ALL",
    "keywords_viewed": "ALL",
    "offset": "0",
    "order_by_mode": "desc",
    "limit": "10",
    "is_p4p": "ALL",
    "keyword": "mp3",
    "order_by_field": "sumShowCnt"
  }
}
```

### 本轮结果
- 首次调用：`InsufficientPermission`
- 最小回归：`InsufficientPermission`
- 收口：`TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

### 现阶段仍不能声称的内容
- 不能声称该方法对 XD 当前租户已可读。
- 不能声称当前 doc 示例已经构成完整业务字段契约。
- 不能把该方法接回 production route 或报表层。

## 方法 2：`alibaba.mydata.industry.keyword.get`

### 当前已知最小参数集合
- 顶层必填：
  - `keywords`
  - `properties`
- 官方文档示例里的 `properties` 字段：
  - `offset`
  - `order_by_mode`
  - `limit`
  - `precise_match`
  - `order_by_field`

### 本轮采用的最小 live 请求
```json
{
  "keywords": "mp3",
  "properties": {
    "offset": "0",
    "order_by_mode": "desc",
    "limit": "10",
    "precise_match": "false",
    "order_by_field": "srh_pv_this_mon"
  }
}
```

### 本轮结果
- 首次调用：`InsufficientPermission`
- 最小回归：`InsufficientPermission`
- 收口：`TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

### 现阶段仍不能声称的内容
- 不能声称该方法已具备 XD 当前租户的稳定可读权限。
- 不能把 stage28 的 `date_range + industry` 旧候选写法继续当成唯一正确契约。
- 不能把该方法接回 production route 或 runtime 消费层。

## 最终判断
- `properties` 最小契约在当前 safe-scope 内已经闭环到“足够越过参数层”。
- 这不是“完整业务字段契约闭环”，而是“最小可验证请求契约闭环”。
- 当前真正阻塞已从“缺 `properties`”切换为“对象级 restriction 仍存在”。

## 后续唯一值得重开的条件
- 拿到新的外部租户/产品级授权或对象范围证据。
- 或拿到能证明当前租户对 keyword family 实际可读的新 live 样本。
