from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from html import escape
from pathlib import Path

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT_DIR = Path(__file__).resolve().parents[2]
DELIVERABLES_DIR = ROOT_DIR / "WIKA" / "docs" / "reports" / "deliverables"
PDF_DIR = DELIVERABLES_DIR / "pdf"
INDEX_PATH = DELIVERABLES_DIR / "WIKA_正式运营报告包索引.md"
SCORE_PATH = DELIVERABLES_DIR / "WIKA_正式运营报告包评分.json"
EVIDENCE_PATH = DELIVERABLES_DIR / "evidence" / "WIKA_正式运营报告包证据.json"
PDF_MANIFEST_PATH = PDF_DIR / "WIKA_正式运营报告包_PDF清单.json"

BOUNDARY_LINES = [
    "not task 1 complete",
    "not task 2 complete",
    "not task 3 complete",
    "not task 4 complete",
    "not task 5 complete",
    "task 6 excluded",
    "no write action attempted",
    "WIKA-only thread for business work",
    "XD untouched in business execution",
    "not full business cockpit",
]

REPORTS = [
    {
        "filename": "WIKA_管理层简报.md",
        "pdf_name": "WIKA_管理层简报.pdf",
        "roles": ["老板 / 管理层", "运营负责人"],
        "manual_inputs": "需要人工补广告样本、页面盘点、最终报价与交期口径。",
        "major": True,
    },
    {
        "filename": "WIKA_运营周报.md",
        "pdf_name": "WIKA_运营周报.pdf",
        "roles": ["运营负责人", "店铺运营"],
        "manual_inputs": "需要人工补广告样本、页面盘点和产品素材更新状态。",
        "major": True,
    },
    {
        "filename": "WIKA_经营诊断报告.md",
        "pdf_name": "WIKA_经营诊断报告.pdf",
        "roles": ["管理层", "运营负责人", "店铺运营"],
        "manual_inputs": "需要人工确认盲区影响、广告样本、页面盘点与跨部门执行节奏。",
        "major": True,
    },
    {
        "filename": "WIKA_产品优化建议报告.md",
        "pdf_name": "WIKA_产品优化建议报告.pdf",
        "roles": ["产品运营", "设计", "运营负责人"],
        "manual_inputs": "需要人工补产品规格、材质、主图、视频、详情素材和关键词校对。",
        "major": True,
    },
    {
        "filename": "WIKA_广告分析报告.md",
        "pdf_name": "WIKA_广告分析报告.pdf",
        "roles": ["广告投放负责人", "运营负责人"],
        "manual_inputs": "必须人工提供真实广告导出样本，否则只能作为 readiness 报告使用。",
        "major": True,
    },
    {
        "filename": "WIKA_店铺执行清单.md",
        "pdf_name": "WIKA_店铺执行清单.pdf",
        "roles": ["店铺运营", "执行同事"],
        "manual_inputs": "需要人工按日/周执行并勾选补数项。",
        "major": False,
    },
    {
        "filename": "WIKA_销售跟单使用清单.md",
        "pdf_name": "WIKA_销售跟单使用清单.pdf",
        "roles": ["销售", "跟单"],
        "manual_inputs": "最终报价、交期、样品、买家信息仍需人工确认。",
        "major": False,
    },
    {
        "filename": "WIKA_人工接手清单.md",
        "pdf_name": "WIKA_人工接手清单.pdf",
        "roles": ["人工接手人员", "运营负责人", "销售 / 跟单"],
        "manual_inputs": "清单本身就是人工补数与人工确认入口。",
        "major": False,
    },
]


def ensure_dir(path_obj: Path) -> None:
    path_obj.mkdir(parents=True, exist_ok=True)


def read_text(path_obj: Path) -> str:
    return path_obj.read_text(encoding="utf-8")


def read_json(path_obj: Path) -> dict:
    return json.loads(read_text(path_obj))


def write_text(path_obj: Path, content: str) -> None:
    path_obj.write_text(content.strip() + "\n", encoding="utf-8")


def write_json(path_obj: Path, content: dict) -> None:
    path_obj.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_inline(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1（\2）", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    return escape(text)


def flush_paragraph(buffer: list[str], story: list, styles: dict) -> None:
    if not buffer:
        return
    text = normalize_inline(" ".join(line.strip() for line in buffer if line.strip()))
    if text:
        story.append(Paragraph(text, styles["body"]))
    buffer.clear()


def build_styles() -> dict:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleZh",
            parent=base["Title"],
            fontName="STSong-Light",
            fontSize=20,
            leading=26,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "H1Zh",
            parent=base["Heading1"],
            fontName="STSong-Light",
            fontSize=16,
            leading=22,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "H2Zh",
            parent=base["Heading2"],
            fontName="STSong-Light",
            fontSize=14,
            leading=20,
            spaceBefore=8,
            spaceAfter=5,
        ),
        "h3": ParagraphStyle(
            "H3Zh",
            parent=base["Heading3"],
            fontName="STSong-Light",
            fontSize=12,
            leading=18,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "BodyZh",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=10.5,
            leading=16,
            wordWrap="CJK",
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "BulletZh",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=10.5,
            leading=16,
            wordWrap="CJK",
            leftIndent=14,
            firstLineIndent=-8,
            spaceAfter=2,
        ),
    }


def markdown_to_story(text: str, styles: dict) -> list:
    story: list = []
    paragraph_buffer: list[str] = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_paragraph(paragraph_buffer, story, styles)
            if story and not isinstance(story[-1], Spacer):
                story.append(Spacer(1, 4))
            continue

        if stripped.startswith("# "):
            flush_paragraph(paragraph_buffer, story, styles)
            story.append(Paragraph(normalize_inline(stripped[2:]), styles["title"]))
            continue
        if stripped.startswith("## "):
            flush_paragraph(paragraph_buffer, story, styles)
            story.append(Paragraph(normalize_inline(stripped[3:]), styles["h1"]))
            continue
        if stripped.startswith("### "):
            flush_paragraph(paragraph_buffer, story, styles)
            story.append(Paragraph(normalize_inline(stripped[4:]), styles["h2"]))
            continue
        if stripped.startswith("#### "):
            flush_paragraph(paragraph_buffer, story, styles)
            story.append(Paragraph(normalize_inline(stripped[5:]), styles["h3"]))
            continue
        if stripped.startswith("- "):
            flush_paragraph(paragraph_buffer, story, styles)
            story.append(Paragraph(f"• {normalize_inline(stripped[2:])}", styles["bullet"]))
            continue
        if re.match(r"^\d+\.\s+", stripped):
            flush_paragraph(paragraph_buffer, story, styles)
            story.append(Paragraph(normalize_inline(stripped), styles["bullet"]))
            continue

        paragraph_buffer.append(stripped)

    flush_paragraph(paragraph_buffer, story, styles)
    return story


def render_pdf(markdown_path: Path, pdf_path: Path, styles: dict) -> None:
    story = markdown_to_story(read_text(markdown_path), styles)
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=markdown_path.stem,
        author="Codex",
    )
    doc.build(story)


def is_writable_dir(path_obj: Path) -> bool:
    try:
        ensure_dir(path_obj)
        with tempfile.NamedTemporaryFile(dir=path_obj, delete=True):
            return True
    except Exception:
        return False


def detect_desktop_dir() -> Path:
    profile = os.environ.get("USERPROFILE", "")
    candidates = []
    if profile:
        profile_path = Path(profile)
        candidates.extend(
            [
                profile_path / "Desktop",
                profile_path / "桌面",
                profile_path / "OneDrive" / "Desktop",
                profile_path / "OneDrive" / "桌面",
            ]
        )
    home = Path.home()
    candidates.extend(
        [
            home / "Desktop",
            home / "桌面",
        ]
    )

    for candidate in candidates:
        if candidate.exists() and candidate.is_dir() and is_writable_dir(candidate):
            return candidate

    attempted = "\n".join(f"- {candidate}" for candidate in candidates)
    raise RuntimeError(f"未找到可写桌面目录，已尝试：\n{attempted}")


def validate_report(report: dict) -> dict:
    source = DELIVERABLES_DIR / report["filename"]
    if not source.exists():
        return {"file": str(source), "ok": False, "reason": "文件不存在"}

    text = read_text(source)
    if not text.strip():
        return {"file": str(source), "ok": False, "reason": "文件为空"}

    result = {
        "file": str(source),
        "ok": True,
        "size_bytes": source.stat().st_size,
        "has_summary_or_headline": bool(
            re.search(r"##\s*(执行摘要|一句话结论|当前状态结论)", text)
        ) if report["major"] else True,
        "has_priority_actions": all(tag in text for tag in ["P1", "P2", "P3"]) if report["major"] else True,
        "has_manual_handoff": "人工" in text,
        "has_boundary_statement": "边界声明" in text,
        "has_false_complete": bool(
            re.search(r"(?<!not )task 1 complete|(?<!not )task 2 complete|(?<!not )task 3 complete|(?<!not )task 4 complete|(?<!not )task 5 complete", text)
        ),
    }

    if report["filename"] == "WIKA_广告分析报告.md":
        result["ads_sample_boundary_present"] = ("没有真实广告" in text) or ("readiness" in text)
    else:
        result["ads_sample_boundary_present"] = True

    result["ok"] = all(
        [
            result["has_summary_or_headline"],
            result["has_priority_actions"],
            result["has_manual_handoff"],
            result["has_boundary_statement"],
            not result["has_false_complete"],
            result["ads_sample_boundary_present"],
        ]
    )

    if not result["ok"]:
        failed = [
            key
            for key in [
                "has_summary_or_headline",
                "has_priority_actions",
                "has_manual_handoff",
                "has_boundary_statement",
                "ads_sample_boundary_present",
            ]
            if not result[key]
        ]
        if result["has_false_complete"]:
            failed.append("has_false_complete")
        result["reason"] = ",".join(failed)

    return result


def render_index(scores: dict, manifest: dict) -> str:
    entries = manifest["files"]
    score_map = scores

    lines = [
        "# WIKA 正式运营报告包索引",
        "",
        "## 报告包说明",
        "",
        "这套报告包基于 stage46 已锁定的运营报告规范、评分标准、示范报告与质量复核结果生成，并补齐 PDF 交付闭环，目标是让管理层、运营、销售、执行同事可以直接使用。",
        "",
        "## 主要报告评分",
        "",
    ]

    for entry in entries:
        score = score_map.get(entry["markdown_name"])
        if score:
            lines.append(f"- {entry['markdown_name']}：{score['total_score']}/{score['max_score']}，{'达到可交付阈值' if score['passed'] else '未达到可交付阈值'}")

    lines.extend(
        [
            "",
            "## 交付文件总览",
            "",
        ]
    )

    for entry in entries:
        score = score_map.get(entry["markdown_name"])
        score_text = f"{score['total_score']}/{score['max_score']}" if score else "未单独评分"
        lines.extend(
            [
                f"### {entry['title']}",
                "",
                f"- Markdown 报告路径：`{entry['markdown_path']}`",
                f"- PDF 仓库内路径：`{entry['repo_pdf']}`",
                f"- PDF 桌面路径：`{entry['desktop_pdf']}`",
                f"- 报告适用角色：{entry['roles_text']}",
                f"- 报告评分：{score_text}",
                f"- 是否需要人工补充数据：{entry['manual_inputs']}",
                "",
            ]
        )

    lines.extend(
        [
            "## 当前已知边界",
            "",
            "- `action-center` 仍可能 degraded，应优先回退到底层稳定 route 取证。",
            "- `operator-console` 仍按高延迟聚合层看待，不写成无条件 full success 承诺。",
            "- 广告分析仍依赖真实广告样本输入。",
            "- 页面优化建议仍依赖人工盘点输入，不写成真实页面行为结论。",
            "- task3/task4/task5 仍停在 workbench / preview / draft / handoff 层。",
            "",
            "## 边界声明",
            "",
        ]
    )

    lines.extend([f"- {item}" for item in BOUNDARY_LINES])
    return "\n".join(lines)


def main() -> None:
    ensure_dir(PDF_DIR)
    styles = build_styles()
    desktop_dir = detect_desktop_dir()
    scores = read_json(SCORE_PATH)
    evidence = read_json(EVIDENCE_PATH)

    validation = [validate_report(report) for report in REPORTS]
    failed_validation = [item for item in validation if not item["ok"]]
    if failed_validation:
        raise RuntimeError(f"报告包验收未通过：{json.dumps(failed_validation, ensure_ascii=False)}")

    manifest = {
        "generated_at": evidence.get("generated_at"),
        "desktop_dir": str(desktop_dir),
        "files": [],
        "validation": validation,
    }

    for report in REPORTS:
        source = DELIVERABLES_DIR / report["filename"]
        repo_pdf = PDF_DIR / report["pdf_name"]
        render_pdf(source, repo_pdf, styles)
        desktop_pdf = desktop_dir / report["pdf_name"]
        shutil.copy2(repo_pdf, desktop_pdf)

        manifest["files"].append(
            {
                "title": source.stem,
                "markdown_name": report["filename"],
                "markdown_path": str(source),
                "repo_pdf": str(repo_pdf),
                "desktop_pdf": str(desktop_pdf),
                "roles": report["roles"],
                "roles_text": "、".join(report["roles"]),
                "manual_inputs": report["manual_inputs"],
                "major": report["major"],
                "repo_pdf_size_bytes": repo_pdf.stat().st_size,
                "desktop_pdf_size_bytes": desktop_pdf.stat().st_size,
            }
        )

    write_json(PDF_MANIFEST_PATH, manifest)
    write_text(INDEX_PATH, render_index(scores, manifest))

    print(json.dumps({"ok": True, **manifest}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
