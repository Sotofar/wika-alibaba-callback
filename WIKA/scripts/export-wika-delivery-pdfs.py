from __future__ import annotations

import html
import json
import os
import re
import shutil
from pathlib import Path

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT_DIR = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT_DIR / "WIKA" / "docs" / "reports"
FILES = [
    {
        "source": REPORT_DIR / "WIKA_全平台诊断报告.md",
        "pdf": REPORT_DIR / "WIKA_全平台诊断报告.pdf",
    },
    {
        "source": REPORT_DIR / "WIKA_现阶段可落地使用手册.md",
        "pdf": REPORT_DIR / "WIKA_现阶段可落地使用手册.pdf",
    },
]


def get_desktop_dir() -> Path:
    candidates = []
    profile = os.environ.get("USERPROFILE")
    if profile:
        candidates.append(Path(profile) / "Desktop")
    candidates.append(Path.home() / "Desktop")
    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            return candidate
    raise RuntimeError(f"未找到可用桌面目录，已尝试：{', '.join(str(item) for item in candidates)}")


def build_styles():
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ZhTitle",
            parent=base["Title"],
            fontName="STSong-Light",
            fontSize=20,
            leading=26,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "ZhH1",
            parent=base["Heading1"],
            fontName="STSong-Light",
            fontSize=16,
            leading=22,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "ZhH2",
            parent=base["Heading2"],
            fontName="STSong-Light",
            fontSize=14,
            leading=20,
            spaceBefore=8,
            spaceAfter=5,
        ),
        "h3": ParagraphStyle(
            "ZhH3",
            parent=base["Heading3"],
            fontName="STSong-Light",
            fontSize=12,
            leading=18,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "ZhBody",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=10.5,
            leading=16,
            wordWrap="CJK",
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "ZhBullet",
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


def normalize_inline(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1（\2）", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    return html.escape(text)


def flush_paragraph(buffer: list[str], story: list, styles: dict) -> None:
    if not buffer:
        return
    text = normalize_inline(" ".join(line.strip() for line in buffer if line.strip()))
    if text:
        story.append(Paragraph(text, styles["body"]))
    buffer.clear()


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

        paragraph_buffer.append(stripped)

    flush_paragraph(paragraph_buffer, story, styles)
    return story


def render_pdf(source_path: Path, pdf_path: Path, styles: dict) -> None:
    if not source_path.exists():
        raise FileNotFoundError(f"缺少源 Markdown：{source_path}")
    text = source_path.read_text(encoding="utf-8")
    story = markdown_to_story(text, styles)
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=source_path.stem,
        author="Codex",
    )
    doc.build(story)


def main() -> None:
    styles = build_styles()
    desktop_dir = get_desktop_dir()
    manifest = {
        "desktop_dir": str(desktop_dir),
        "files": [],
    }

    for item in FILES:
        source = item["source"]
        pdf = item["pdf"]
        pdf.parent.mkdir(parents=True, exist_ok=True)
        render_pdf(source, pdf, styles)
        desktop_target = desktop_dir / pdf.name
        shutil.copy2(pdf, desktop_target)
        manifest["files"].append(
            {
                "source_markdown": str(source),
                "repo_pdf": str(pdf),
                "desktop_pdf": str(desktop_target),
            }
        )

    print(json.dumps({"ok": True, **manifest}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
