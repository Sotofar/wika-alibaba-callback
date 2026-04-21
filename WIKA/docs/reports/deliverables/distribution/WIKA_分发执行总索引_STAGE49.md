# WIKA 分发执行总索引 STAGE49

## 分发状态

Stage49 已把 stage47/stage48 报告包整理为可实际分发的角色 outbox。当前不重新生成 PDF，不重新确认报告包是否存在，不做 runtime 性能优化。

| 角色 | outbox 文件 | 主 PDF | 辅 PDF | 是否可立即分发 | 分发前人工确认 | 反馈 owner |
| --- | --- | --- | --- | --- | --- | --- |
| 老板 / 管理层 | `stage49_outbox/WIKA_老板管理层分发包_STAGE49.md` | `WIKA_管理层简报.pdf` | `WIKA_经营诊断报告.pdf` | yes | 确认分发对象 | `ops_lead` |
| 运营负责人 | `stage49_outbox/WIKA_运营负责人分发包_STAGE49.md` | `WIKA_运营周报.pdf` | `WIKA_经营诊断报告.pdf` | yes | 确认复盘窗口 | `ops_lead` |
| 店铺运营 | `stage49_outbox/WIKA_店铺运营分发包_STAGE49.md` | `WIKA_店铺执行清单.pdf` | `WIKA_运营周报.pdf` | yes | 确认执行权限边界 | `store_operator` |
| 产品运营 | `stage49_outbox/WIKA_产品运营分发包_STAGE49.md` | `WIKA_产品优化建议报告.pdf` | `WIKA_人工接手清单.pdf` | yes | 确认产品补数 owner | `product_operator` |
| 销售 / 跟单 | `stage49_outbox/WIKA_销售跟单分发包_STAGE49.md` | `WIKA_销售跟单使用清单.pdf` | `WIKA_人工接手清单.pdf` | yes | 确认买家/订单脱敏口径 | `sales_owner` |
| 人工接手 | `stage49_outbox/WIKA_人工接手分发包_STAGE49.md` | `WIKA_人工接手清单.pdf` | `WIKA_销售跟单使用清单.pdf` | yes | 确认补数回收路径 | `handoff_owner` |

## 当前统一边界

- task1-5 not complete。
- task6 excluded。
- no write action attempted。
- WIKA-only thread for business work。
- XD untouched in business execution。
- not full business cockpit。
- degraded route 已接受为合理降级，不阻塞分发。

