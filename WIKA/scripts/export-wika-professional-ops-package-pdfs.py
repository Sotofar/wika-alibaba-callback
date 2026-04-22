from __future__ import annotations

import json
import os
import re
import shutil
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
PACKAGE_DIR = ROOT / "WIKA" / "docs" / "operations-package"
PDF_DIR = PACKAGE_DIR / "pdf"

PDF_SOURCES = [
    "WIKA_专业运营总览.md",
    "WIKA_老板管理层简报.md",
    "WIKA_运营负责人周计划.md",
    "WIKA_产品优化工单.md",
    "WIKA_直通车数据导入与投放调整表.md",
    "WIKA_运营任务总看板.md",
]


def desktop_wika_dir() -> Path:
    explicit = os.environ.get("WIKA_DESKTOP_DIR")
    if explicit:
        path = Path(explicit)
        path.mkdir(parents=True, exist_ok=True)
        return path

    profile = Path(os.environ.get("USERPROFILE", str(Path.home())))
    candidates = [
        profile / "Desktop" / "WIKA",
        profile / "桌面" / "WIKA",
        profile / "OneDrive" / "Desktop" / "WIKA",
        profile / "OneDrive" / "桌面" / "WIKA",
        Path.home() / "Desktop" / "WIKA",
        Path.home() / "桌面" / "WIKA",
    ]
    for candidate in candidates:
        parent = candidate.parent
        if parent.exists():
            candidate.mkdir(parents=True, exist_ok=True)
            return candidate
    raise RuntimeError("未找到可写桌面路径")


def register_fonts() -> None:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def clean_inline(text: str) -> str:
    text = escape(text.strip())
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1（\2）", text)
    return text


def table_row(line: str) -> list[str] | None:
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return None
    cells = [cell.strip() for cell in stripped.strip("|").split("|")]
    if all(set(cell.replace(":", "").replace("-", "").strip()) == set() for cell in cells):
        return []
    return cells


def build_styles():
    styles = getSampleStyleSheet()
    styles["Title"].fontName = "STSong-Light"
    styles["Title"].fontSize = 18
    styles["Title"].leading = 24
    styles["Heading1"].fontName = "STSong-Light"
    styles["Heading1"].fontSize = 15
    styles["Heading1"].leading = 21
    styles["Heading2"].fontName = "STSong-Light"
    styles["Heading2"].fontSize = 13
    styles["Heading2"].leading = 18
    styles["BodyText"].fontName = "STSong-Light"
    styles["BodyText"].fontSize = 9.8
    styles["BodyText"].leading = 14
    styles.add(ParagraphStyle(name="BulletZh", parent=styles["BodyText"], leftIndent=12, firstLineIndent=-8))
    styles.add(ParagraphStyle(name="TableCellZh", fontName="STSong-Light", fontSize=7.2, leading=9))
    return styles


def markdown_to_story(markdown: str, styles) -> list:
    story: list = []
    lines = markdown.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 4))
            i += 1
            continue

        row = table_row(line)
        if row is not None:
            rows = []
            while i < len(lines):
                maybe = table_row(lines[i])
                if maybe is None:
                    break
                if maybe:
                    rows.append([Paragraph(clean_inline(cell), styles["TableCellZh"]) for cell in maybe])
                i += 1
            if rows:
                table = Table(rows, repeatRows=1)
                table.setStyle(
                    TableStyle(
                        [
                            ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2F7")),
                            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 4),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                            ("TOPPADDING", (0, 0), (-1, -1), 3),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ]
                    )
                )
                story.append(table)
                story.append(Spacer(1, 8))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(clean_inline(stripped[2:]), styles["Title"]))
        elif stripped.startswith("## "):
            story.append(Paragraph(clean_inline(stripped[3:]), styles["Heading1"]))
        elif stripped.startswith("### "):
            story.append(Paragraph(clean_inline(stripped[4:]), styles["Heading2"]))
        elif stripped.startswith("- "):
            story.append(Paragraph("• " + clean_inline(stripped[2:]), styles["BulletZh"]))
        elif re.match(r"^\d+\.\s+", stripped):
            story.append(Paragraph(clean_inline(stripped), styles["BulletZh"]))
        else:
            story.append(Paragraph(clean_inline(stripped), styles["BodyText"]))
        i += 1
    return story


def render_pdf(source: Path, target: Path, styles) -> None:
    markdown = source.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(target),
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=source.stem,
        author="Codex",
    )
    doc.build(markdown_to_story(markdown, styles))


def main() -> None:
    register_fonts()
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    desktop_dir = desktop_wika_dir()
    styles = build_styles()

    exported = []
    for name in PDF_SOURCES:
        source = PACKAGE_DIR / name
        if not source.exists():
            raise FileNotFoundError(source)
        target = PDF_DIR / f"{source.stem}.pdf"
        render_pdf(source, target, styles)
        desktop_target = desktop_dir / target.name
        shutil.copy2(target, desktop_target)
        exported.append(
            {
                "source": str(source.relative_to(ROOT)),
                "repo_pdf": str(target.relative_to(ROOT)),
                "desktop_pdf": str(desktop_target),
                "repo_size": target.stat().st_size,
                "desktop_size": desktop_target.stat().st_size,
            }
        )

    print(json.dumps({"ok": True, "desktop_dir": str(desktop_dir), "exported": exported}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
