# WIKA 后台数据读取说明

## 文档用途

本文件用于说明 `WIKA` 国际站后台在只读模式下已经具备的读取能力、当前限制，以及后续可复用的读取框架。

本文件只基于以下真实来源：

- 当前仓库中的代码、脚本、配置与文档
- 当前线上可访问路由的实际返回
- 当前项目目录中的实际文件

本文件不代表重新授权、重置 token、修复 callback 或修改生产配置已经发生。

## 当前读取链路

截至当前阶段，WIKA 已稳定具备以下只读承接能力：

- 服务存活检查
- OAuth 授权状态读取
- 生产 token 运行状态读取
- 产品、类目、媒体、订单相关已上线只读 route
- 店铺 / 产品 / 订单摘要与最小诊断 route

## 当前结论

当前已经打通的是“生产接入与只读数据链路”，不是“平台内写入闭环”。

已稳定复用的主链路包括：

1. `GET /health`
2. `GET /integrations/alibaba/auth/debug`
3. 已上线的 WIKA data routes
4. 已上线的 WIKA management summary / minimal diagnostic routes

## 当前可直接使用的数据范围

### 已可读取或已可汇总

- 产品列表、分组、详情、得分
- 类目树与属性
- 媒体列表与媒体分组
- 订单列表、详情、资金、物流
- 店铺级 mydata 摘要字段
- 产品级 mydata 表现字段
- 基于现有 order APIs 的保守订单摘要

### 当前仍受限或需保守表述

- 店铺级 `traffic_source / country_source / quick_reply_rate`
- 产品级 `access_source / inquiry_source / country_source / period_over_period_change`
- 订单级 `country_structure`
- 任何写侧动作

## 当前文档索引

- 数据来源与链路：`WIKA/projects/wika/access/data-sources.md`
- 字段说明：`WIKA/projects/wika/access/data-field-map.md`
- 验证记录：`WIKA/projects/wika/access/data-validation-notes.md`
- 读取流程：`WIKA/projects/wika/access/read-flow.md`
- 可复用框架：`shared/access/data-reading-framework.md`
- 通用验证清单：`shared/access/data-validation-checklist.md`

## 对 XD 的复用边界

WIKA 已验证成功的流程和方法可以作为 XD 的历史参考，但不能直接等同为 XD 已打通。

可复用的是：

- 接入前检查方法
- 配置检查方法
- `/auth/debug` 类型状态检查方法
- token 持久化与自动续期验证方法
- “是否已经具备业务数据读取能力”的判断框架

不可直接复用的是：

- WIKA 的真实 token 存储
- WIKA 的真实授权状态
- WIKA 的业务结论
