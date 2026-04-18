from __future__ import annotations

import html
import json
import os
import re
import shutil
import ssl
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / "WIKA" / "docs" / "reports"
EVIDENCE = ROOT / "WIKA" / "docs" / "framework" / "evidence"
BASE = "https://api.wikapacking.com"
WEEK = "2026-04-06 至 2026-04-12"
START = "2026-04-06 00:00:00"
END = "2026-04-12 23:59:59"
NAME = "WIKA_上周运营报告_2026-04-06_至_2026-04-12"
INDEX = "WIKA_上周运营报告_证据索引_2026-04-06_至_2026-04-12"


def desk():
    candidates = []
    up = os.environ.get("USERPROFILE")
    if up:
        candidates.append(Path(up) / "Desktop")
    un = os.environ.get("USERNAME")
    if un:
        candidates.append(Path(f"C:/Users/{un}/Desktop"))
    candidates.append(Path.home() / "Desktop")
    for item in candidates:
        if item.exists() and item.is_dir():
            return item
    raise RuntimeError("桌面目录不可用：" + "、".join(str(x) for x in candidates))


def now():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def g(node, path, default=None):
    cur = node
    for key in path.split("."):
        if isinstance(cur, dict) and key in cur:
            cur = cur[key]
        else:
            return default
    return cur


def n(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.replace(",", "").strip())
        except Exception:
            return None
    return None


def fmt(value, digits=2, fallback="当前不可得"):
    x = n(value)
    if x is None:
        return fallback
    if float(x).is_integer():
        return str(int(x))
    return f"{x:.{digits}f}"


def pct(value, digits=2, fallback="当前不可得"):
    x = n(value)
    if x is None:
        return fallback
    if abs(x) <= 1:
        return f"{x * 100:.{digits}f}%"
    return f"{x:.{digits}f}%"


def payload(body):
    if isinstance(body, dict):
        for key in ("data", "payload", "result"):
            if isinstance(body.get(key), dict):
                return body[key]
    return body or {}


def safe(value):
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            lk = str(k).lower()
            if any(x in lk for x in ("token", "cookie", "authorization", "secret", "phone", "email")):
                out[k] = "***REDACTED***"
            elif lk in ("trade_id", "e_trade_id", "buyer_name", "buyer_login_id", "address"):
                out[k] = "***REDACTED***"
            else:
                out[k] = safe(v)
        return out
    if isinstance(value, list):
        return [safe(x) for x in value[:20]]
    return value


def display_path(path):
    text = str(path)
    text = re.sub(r"(e_trade_id=)[^&]+", r"\1***REDACTED***", text)
    text = re.sub(r"(product_id=)[^&]+", r"\1***REDACTED***", text)
    text = re.sub(r"(group_id=)[^&]+", r"\1***REDACTED***", text)
    return text


def fetch(path):
    req = urllib.request.Request(urllib.parse.urljoin(BASE, path), headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90, context=ssl.create_default_context()) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            code = resp.getcode()
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        code = exc.code
    except Exception as exc:
        return {"path": path, "status": None, "body": None, "error": str(exc)}
    try:
        body = json.loads(raw)
    except Exception as exc:
        return {"path": path, "status": code, "body": None, "error": f"JSON parse failed: {exc}"}
    return {"path": path, "status": code, "body": body, "error": None}


def ok(result):
    return result.get("status") == 200 and result.get("body") is not None and g(result, "body.ok", True) is not False


def scan():
    routes = {
        "health": "/health",
        "auth_debug": "/integrations/alibaba/auth/debug",
        "ops_ms": "/integrations/alibaba/wika/reports/operations/management-summary",
        "prd_ms": "/integrations/alibaba/wika/reports/products/management-summary",
        "ord_ms": "/integrations/alibaba/wika/reports/orders/management-summary",
        "ops_diag": "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
        "prd_diag": "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
        "ord_diag": "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
        "ops_cmp": "/integrations/alibaba/wika/reports/operations/comparison-summary",
        "prd_cmp": "/integrations/alibaba/wika/reports/products/comparison-summary",
        "ord_cmp": "/integrations/alibaba/wika/reports/orders/comparison-summary",
        "cockpit": "/integrations/alibaba/wika/reports/business-cockpit",
        "action_center": "/integrations/alibaba/wika/reports/action-center",
        "operator_console": "/integrations/alibaba/wika/reports/operator-console",
        "task_workbench": "/integrations/alibaba/wika/workbench/task-workbench",
        "product_workbench": "/integrations/alibaba/wika/workbench/product-draft-workbench",
        "reply_workbench": "/integrations/alibaba/wika/workbench/reply-workbench",
        "order_workbench": "/integrations/alibaba/wika/workbench/order-workbench",
        "products_list": "/integrations/alibaba/wika/data/products/list?page_size=10&current_page=1",
        "orders_list": "/integrations/alibaba/wika/data/orders/list?page_size=5&current_page=1",
    }
    res = {k: fetch(v) for k, v in routes.items()}
    product_items = g(payload(g(res["products_list"], "body")), "products") or g(payload(g(res["products_list"], "body")), "items") or []
    order_items = g(payload(g(res["orders_list"], "body")), "orders") or g(payload(g(res["orders_list"], "body")), "items") or []
    product_id = None
    group_id = None
    for item in product_items if isinstance(product_items, list) else []:
        product_id = item.get("product_id") or item.get("id")
        group_id = item.get("group_id")
        if product_id:
            break
    trade_id = None
    for item in order_items if isinstance(order_items, list) else []:
        trade_id = item.get("e_trade_id") or item.get("trade_id")
        if trade_id:
            break
    if product_id:
        q = urllib.parse.quote(str(product_id))
        res["product_detail"] = fetch(f"/integrations/alibaba/wika/data/products/detail?product_id={q}")
        res["product_score"] = fetch(f"/integrations/alibaba/wika/data/products/score?product_id={q}")
        if group_id:
            res["product_group"] = fetch(f"/integrations/alibaba/wika/data/products/groups?group_id={urllib.parse.quote(str(group_id))}")
    if trade_id:
        q = urllib.parse.quote(str(trade_id))
        res["order_detail"] = fetch(f"/integrations/alibaba/wika/data/orders/detail?e_trade_id={q}")
        res["order_fund"] = fetch(f"/integrations/alibaba/wika/data/orders/fund?e_trade_id={q}&data_select=fund_fundPay,fund_serviceFee,fund_refund")
        res["order_logistics"] = fetch(f"/integrations/alibaba/wika/data/orders/logistics?e_trade_id={q}&data_select=logistic_order")
    return res, {"sample_product_id": product_id, "sample_group_id": group_id, "sample_trade_id": trade_id}


def build_report(res, refs, report_md, report_pdf, index_md, evidence_json):
    ops = payload(g(res["ops_ms"], "body"))
    ops_cmp = payload(g(res["ops_cmp"], "body"))
    prd = payload(g(res["prd_ms"], "body"))
    prd_diag = payload(g(res["prd_diag"], "body"))
    ords = payload(g(res["ord_ms"], "body"))
    ord_cmp = payload(g(res["ord_cmp"], "body"))
    fund = payload(g(res.get("order_fund", {}), "body"))
    logistics = payload(g(res.get("order_logistics", {}), "body"))
    missing_description = g(prd_diag, "content_completeness_findings.missing_description_count")
    missing_keywords = g(prd_diag, "content_completeness_findings.missing_keywords_count")
    low_score = g(prd_diag, "score_summary.quality_score.low_score_count")
    ungrouped_count = g(prd_diag, "structure_findings.ungrouped_count")
    updated_recently = g(prd_diag, "content_completeness_findings.updated_within_30_days_count")
    top5 = [
        f"店铺层当前可见 official 指标为 visitor={fmt(g(ops, 'official_metrics.visitor'))}、imps={fmt(g(ops, 'official_metrics.imps'))}、clk={fmt(g(ops, 'official_metrics.clk'))}、clk_rate={pct(g(ops, 'official_metrics.clk_rate'))}、fb={fmt(g(ops, 'official_metrics.fb'))}、reply={pct(g(ops, 'official_metrics.reply'))}。",
        f"店铺 comparison 显示当前窗口相对上一可比窗口的变化仍可见，但这不是严格自然周日切片；主要变化数据为 {json.dumps(safe(g(ops_cmp, 'derived_comparison', {})), ensure_ascii=False)}。",
        f"产品层当前最明确的问题是商品内容与维护状态：缺详情 {fmt(missing_description)}、缺关键词 {fmt(missing_keywords)}、低分商品 {fmt(low_score)}。",
        f"订单层当前可见 formal_summary 为 {json.dumps(safe(g(ords, 'formal_summary', {})), ensure_ascii=False)}，可用于识别履约与回款风险，但不等于严格上周新增趋势。",
        "当前最大盲区仍是 traffic_source、country_source、quick_reply_rate、access_source、inquiry_source、period_over_period_change、country_structure，相关结论都只能保守处理。",
    ]
    source_lines = []
    for item in res.values():
        source_lines.append(f"- `{display_path(item['path'])}`：HTTP={item['status'] if item['status'] is not None else 'FAILED'}")
    md = f"""# WIKA 上周运营报告（2026-04-06 至 2026-04-12）

## 1. 执行摘要

- 本报告基于 WIKA 当前已验证上线的 production 只读能力生成，包括 summary、diagnostic、comparison、`business-cockpit`、`action-center`、`operator-console`、task3/4/5 workbench，以及产品/订单抽样只读明细。
- 目标周期是 `{START}` 至 `{END}`。由于当前 production 已验证能力大多提供当前窗口、上一可比窗口与样本聚合，而**不能保证严格自然周按日切片**，因此本报告是“上周诊断版报告”，不是严格财务周报。
- 最重要的 5 条结论：
{chr(10).join(f"- {x}" for x in top5)}

## 2. 数据来源与口径说明

### 本次实际使用到的数据源
{chr(10).join(source_lines)}

### 口径与限制
- 直接数据结论：来自 production summary、comparison、orders fund/logistics、products detail/score 等已验证只读路径。
- 推断结论：来自 diagnostic、action-center、operator-console 与 workbench 的建议层，不等于新增 official 字段。
- 时间粒度受限：当前主线能力不能严格证明“2026-04-06 至 2026-04-12”逐日切片，因此以下结论按当前可见窗口和样本保守表达。

## 3. 店铺/整体层诊断

- 当前店铺层可见核心指标：
  - `visitor={fmt(g(ops, 'official_metrics.visitor'))}`
  - `imps={fmt(g(ops, 'official_metrics.imps'))}`
  - `clk={fmt(g(ops, 'official_metrics.clk'))}`
  - `clk_rate={pct(g(ops, 'official_metrics.clk_rate'))}`
  - `fb={fmt(g(ops, 'official_metrics.fb'))}`
  - `reply={pct(g(ops, 'official_metrics.reply'))}`
- comparison 结果：`{json.dumps(safe(g(ops_cmp, 'derived_comparison', {})), ensure_ascii=False)}`
- 当前能成立的整体结论：
  - 店铺层经营信号仍可监控，但只能覆盖流量、点击、反馈、reply 相关的已验证 official 字段。
  - 店铺层缺少 `traffic_source`、`country_source`、`quick_reply_rate`，因此无法判断渠道构成、国家构成和完整响应质量。
  - 当前更适合回答“整体有没有变强/变弱”，不适合回答“为什么来自某个国家/渠道变化”。

## 4. 产品层诊断

- 当前产品经营摘要：`{json.dumps(safe(g(prd, 'aggregate_official_metrics', {})), ensure_ascii=False)}`
- 当前样本边界：
  - `product_scope_limit={fmt(g(prd, 'product_scope_limit'))}`
  - `product_scope_truncated={g(prd, 'product_scope_truncated')}`
  - `product_ids_used_count={fmt(g(prd, 'product_ids_used_count'))}`
- 产品内容与维护状态：
  - `missing_description_count={fmt(missing_description)}`
  - `missing_keywords_count={fmt(missing_keywords)}`
  - `low_score_count={fmt(low_score)}`
  - `ungrouped_count={fmt(ungrouped_count)}`
  - `updated_within_30_days_count={fmt(updated_recently)}`
- 可分析范围：
  - 可以分析商品结构、详情完整度、关键词覆盖、评分与分组维护状态。
  - 如果缺少稳定曝光点击样本或值为 0，只能从内容质量与维护状态诊断，不应硬写流量转化结论。
- 当前产品层最主要问题：
  - 商品内容完整度与关键词覆盖不足。
  - 当前缺少 `access_source`、`inquiry_source`、`country_source`、`period_over_period_change`，因此不能对来源与国家做证据充分的产品经营判断。

## 5. 订单层诊断

- 当前订单汇总：`{json.dumps(safe(g(ords, 'formal_summary', {})), ensure_ascii=False)}`
- 当前产品贡献：`{json.dumps(safe(g(ords, 'product_contribution', {})), ensure_ascii=False)}`
- 当前趋势信号：`{json.dumps(safe(g(ords, 'trend_signal', {})), ensure_ascii=False)}`
- 抽样资金信息：`{json.dumps(safe(fund), ensure_ascii=False) if fund else '当前未取到 fund 样本'}`
- 抽样物流信息：`{json.dumps(safe(logistics), ensure_ascii=False) if logistics else '当前未取到 logistics 样本'}`
- 当前订单层重点问题：
  - 如果物流样本仍有未发货或异常状态，应优先做履约跟进。
  - 如果资金样本存在待付款或异常项，应优先做回款与订单状态核对。
  - `country_structure` 仍 unavailable，因此不能做订单国家结构判断。
- 口径限制：
  - 当前 order comparison 与 formal_summary 仍是窗口/样本口径，不是严格自然周新增订单趋势。

## 6. 风险与阻塞

- 店铺级缺口：`traffic_source`、`country_source`、`quick_reply_rate`
- 产品级缺口：`access_source`、`inquiry_source`、`country_source`、`period_over_period_change`
- 订单级缺口：`country_structure`
- 这些缺口会导致：
  - 无法做渠道归因
  - 无法做国家维度经营判断
  - 无法对订单区域结构下结论
  - 无法把产品 comparison 升级成完整官方周期对比
- 当前仍需人工补充：
  - 重点市场判断
  - 渠道/国家归因
  - task3/4/5 的平台内真实执行

## 7. 下周建议动作

### P0：立刻执行
- 优先补齐缺详情、缺关键词、低分商品，先处理最影响曝光与转化的商品内容问题。
- 逐笔核对未发货、未付款订单样本，优先清理履约与回款风险。
- 先用 `operator-console`、`action-center`、`orders/minimal-diagnostic` 开周会，统一本周第一优先动作。

### P1：本周推进
- 按 `products/list`、`products/detail`、`products/score` 结果整理重点商品维护清单。
- 持续跟踪店铺 comparison，判断访客、曝光、点击、反馈、reply 是否继续走弱。
- 将 task3/4/5 保持在 workbench / preview / draft 支持层，由人工接手最终执行。

### P2：后续跟进
- 等待官方可用的来源/国家类字段后，再升级来源归因与国家判断。
- 沉淀固定周报流程和证据索引，形成标准化经营巡检机制。
- 若未来拿到严格自然周切片能力，再升级为严格周报。

## 8. 附录

### 数据源清单
{chr(10).join(source_lines)}

### 生成时间
- `{now()}`

### 本次使用的关键文件/脚本路径
- 报告 Markdown：`{report_md}`
- 报告 PDF：`{report_pdf}`
- 证据索引：`{index_md}`
- 证据 JSON：`{evidence_json}`
- 生成脚本：`{ROOT / 'WIKA' / 'scripts' / 'generate-wika-weekly-operations-report.py'}`
"""
    summary = {
        "generated_at": now(),
        "period": {"label": WEEK, "start": START, "end": END, "strict_daily_slice_supported": False},
        "top5": top5,
    }
    return md, summary


def styles():
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("t", parent=base["Title"], fontName="STSong-Light", fontSize=20, leading=26, alignment=TA_CENTER, spaceAfter=8),
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="STSong-Light", fontSize=15, leading=22, spaceBefore=10, spaceAfter=6),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="STSong-Light", fontSize=13, leading=19, spaceBefore=8, spaceAfter=5),
        "body": ParagraphStyle("b", parent=base["BodyText"], fontName="STSong-Light", fontSize=10.5, leading=16, wordWrap="CJK", spaceAfter=4),
        "bullet": ParagraphStyle("u", parent=base["BodyText"], fontName="STSong-Light", fontSize=10.5, leading=16, wordWrap="CJK", leftIndent=14, firstLineIndent=-8, spaceAfter=2),
    }


def clean(text):
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1（\2）", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    return html.escape(text)


def story(md):
    s, buf, st = [], [], styles()
    def flush():
        if buf:
            s.append(Paragraph(clean(" ".join(x.strip() for x in buf if x.strip())), st["body"]))
            buf.clear()
    for raw in md.splitlines():
        line = raw.rstrip()
        t = line.strip()
        if not t:
            flush()
            if s and not isinstance(s[-1], Spacer):
                s.append(Spacer(1, 4))
            continue
        if t.startswith("# "):
            flush(); s.append(Paragraph(clean(t[2:]), st["title"])); continue
        if t.startswith("## "):
            flush(); s.append(Paragraph(clean(t[3:]), st["h1"])); continue
        if t.startswith("### "):
            flush(); s.append(Paragraph(clean(t[4:]), st["h2"])); continue
        if t.startswith("- "):
            flush(); s.append(Paragraph("• " + clean(t[2:]), st["bullet"])); continue
        buf.append(t)
    flush()
    return s


def pdf(md_path, pdf_path):
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=15 * mm, title=md_path.stem, author="Codex")
    doc.build(story(md_path.read_text(encoding="utf-8")))


def main():
    REPORTS.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    desktop = desk()
    report_md = REPORTS / f"{NAME}.md"
    report_pdf = REPORTS / f"{NAME}.pdf"
    index_md = REPORTS / f"{INDEX}.md"
    evidence_json = EVIDENCE / "wika-weekly-operations-report-2026-04-06_2026-04-12.json"
    res, refs = scan()
    md, summary = build_report(res, refs, report_md, report_pdf, index_md, evidence_json)
    index = "\n".join([
        f"# {INDEX}",
        "",
        f"- 生成时间：`{now()}`",
        f"- 目标周期：`{START}` 至 `{END}`",
        "- 说明：本次报告为上周诊断版，时间粒度受限于当前已验证 production 只读主线。",
        "",
        "## 路由证据清单",
        *[f"- `{display_path(item['path'])}`：HTTP={item['status'] if item['status'] is not None else 'FAILED'}" for item in res.values()],
        "",
        "## 本次落盘文件",
        f"- 报告 Markdown：`{report_md}`",
        f"- 报告 PDF：`{report_pdf}`",
        f"- 证据索引：`{index_md}`",
        f"- 证据 JSON：`{evidence_json}`",
    ]) + "\n"
    evidence = {
        "generated_at": now(),
        "period": {"label": WEEK, "start": START, "end": END, "strict_daily_slice_supported": False},
        "sample_refs": safe(refs),
        "route_results": {k: safe(v) for k, v in res.items()},
        "summary": summary,
    }
    report_md.write_text(md, encoding="utf-8")
    index_md.write_text(index, encoding="utf-8")
    evidence_json.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    pdf(report_md, report_pdf)
    shutil.copy2(report_md, desktop / report_md.name)
    shutil.copy2(report_pdf, desktop / report_pdf.name)
    shutil.copy2(index_md, desktop / index_md.name)
    print(json.dumps({
        "ok": True,
        "desktop_markdown": str(desktop / report_md.name),
        "desktop_pdf": str(desktop / report_pdf.name),
        "desktop_index": str(desktop / index_md.name),
        "repo_evidence": str(evidence_json),
        "route_status": {k: v.get("status") for k, v in res.items()},
        "top5": summary["top5"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
