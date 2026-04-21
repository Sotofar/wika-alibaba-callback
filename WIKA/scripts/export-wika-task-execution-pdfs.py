from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path.cwd()
EXECUTION_ROOT = ROOT / "WIKA" / "docs" / "tasks" / "execution"
INPUTS_ROOT = ROOT / "WIKA" / "docs" / "tasks" / "inputs"
PDF_ROOT = EXECUTION_ROOT / "pdf"

SOURCES = [
    EXECUTION_ROOT / "WIKA_任务执行总看板.md",
    EXECUTION_ROOT / "WIKA_P1任务执行看板.md",
    EXECUTION_ROOT / "WIKA_blocked任务清障看板.md",
    EXECUTION_ROOT / "WIKA_按角色执行看板.md",
    EXECUTION_ROOT / "WIKA_本周执行计划.md",
    INPUTS_ROOT / "WIKA_人工输入总清单.md",
]


def register_fonts():
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def clean_inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def split_table_row(line: str):
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return None
    cells = [cell.strip() for cell in stripped.strip("|").split("|")]
    return cells


def is_separator(cells):
    return cells and all(set(cell.replace(":", "").replace("-", "")) <= {""} for cell in cells)


def build_story(markdown: str, styles):
    story = []
    lines = markdown.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index].rstrip()
        if not line:
            story.append(Spacer(1, 4))
            index += 1
            continue

        row = split_table_row(line)
        if row is not None:
            table_rows = []
            while index < len(lines):
                maybe_row = split_table_row(lines[index])
                if maybe_row is None:
                    break
                if not is_separator(maybe_row):
                    table_rows.append([Paragraph(clean_inline(cell), styles["TableCell"]) for cell in maybe_row])
                index += 1
            if table_rows:
                table = Table(table_rows, repeatRows=1)
                table.setStyle(TableStyle([
                    ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2F7")),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ]))
                story.append(table)
                story.append(Spacer(1, 8))
            continue

        if line.startswith("# "):
            story.append(Paragraph(clean_inline(line[2:]), styles["Title"]))
        elif line.startswith("## "):
            story.append(Paragraph(clean_inline(line[3:]), styles["Heading2"]))
        elif line.startswith("### "):
            story.append(Paragraph(clean_inline(line[4:]), styles["Heading3"]))
        elif line.startswith("- "):
            story.append(Paragraph("• " + clean_inline(line[2:]), styles["Body"]))
        else:
            story.append(Paragraph(clean_inline(line), styles["Body"]))
        index += 1
    return story


def export_pdf(source: Path):
    if not source.exists():
        raise FileNotFoundError(source)
    PDF_ROOT.mkdir(parents=True, exist_ok=True)
    target = PDF_ROOT / f"{source.stem}.pdf"
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Body", fontName="STSong-Light", fontSize=9.5, leading=14))
    styles.add(ParagraphStyle(name="TableCell", fontName="STSong-Light", fontSize=7.2, leading=9))
    styles["Title"].fontName = "STSong-Light"
    styles["Title"].fontSize = 18
    styles["Heading2"].fontName = "STSong-Light"
    styles["Heading2"].fontSize = 13
    styles["Heading3"].fontName = "STSong-Light"
    styles["Heading3"].fontSize = 11
    doc = SimpleDocTemplate(
        str(target),
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )
    markdown = source.read_text(encoding="utf-8")
    doc.build(build_story(markdown, styles))
    return {"source": str(source.relative_to(ROOT)), "pdf": str(target.relative_to(ROOT)), "size": target.stat().st_size}


def main():
    register_fonts()
    exported = [export_pdf(source) for source in SOURCES]
    print({"exported": exported})


if __name__ == "__main__":
    main()
