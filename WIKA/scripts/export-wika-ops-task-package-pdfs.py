from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


REPO_ROOT = Path.cwd()
TASKS_ROOT = REPO_ROOT / "WIKA" / "docs" / "tasks"
PDF_ROOT = TASKS_ROOT / "pdf"

TASK_REPORTS = [
    "WIKA_运营任务总看板.md",
    "WIKA_老板管理层任务清单.md",
    "WIKA_运营负责人任务清单.md",
    "WIKA_店铺运营任务清单.md",
    "WIKA_产品运营任务清单.md",
    "WIKA_销售跟单任务清单.md",
    "WIKA_人工接手字段补齐清单.md",
]


def register_fonts():
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def styles():
    base = getSampleStyleSheet()
    font = "STSong-Light"
    return {
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName=font,
            fontSize=18,
            leading=24,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName=font,
            fontSize=14,
            leading=20,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName=font,
            fontSize=12,
            leading=18,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName=font,
            fontSize=10,
            leading=15,
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontName=font,
            fontSize=10,
            leading=15,
            leftIndent=10,
            firstLineIndent=-6,
            spaceAfter=3,
        ),
    }


def normalize_inline(text: str) -> str:
    return escape(text.replace("`", ""))


def markdown_to_story(markdown: str, style_map):
    story = []
    for raw in markdown.splitlines():
        line = raw.rstrip()
        if not line:
            story.append(Spacer(1, 3))
            continue
        if line.startswith("# "):
            story.append(Paragraph(normalize_inline(line[2:]), style_map["h1"]))
        elif line.startswith("## "):
            story.append(Paragraph(normalize_inline(line[3:]), style_map["h2"]))
        elif line.startswith("### "):
            story.append(Paragraph(normalize_inline(line[4:]), style_map["h3"]))
        elif line.startswith("- "):
            story.append(Paragraph("• " + normalize_inline(line[2:]), style_map["bullet"]))
        else:
            story.append(Paragraph(normalize_inline(line), style_map["body"]))
    return story


def export_pdf(source: Path, target: Path):
    markdown = source.read_text(encoding="utf-8")
    if not markdown.strip():
        raise ValueError(f"Markdown 为空: {source}")
    doc = SimpleDocTemplate(
        str(target),
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title=source.stem,
    )
    doc.build(markdown_to_story(markdown, styles()))
    if not target.exists() or target.stat().st_size <= 0:
        raise RuntimeError(f"PDF 生成失败: {target}")


def main():
    register_fonts()
    PDF_ROOT.mkdir(parents=True, exist_ok=True)
    exported = []
    for name in TASK_REPORTS:
        source = TASKS_ROOT / name
        target = PDF_ROOT / f"{Path(name).stem}.pdf"
        if not source.exists():
            raise FileNotFoundError(source)
        export_pdf(source, target)
        exported.append(
            {
                "source": str(source.relative_to(REPO_ROOT)),
                "pdf": str(target.relative_to(REPO_ROOT)),
                "size": target.stat().st_size,
            }
        )
    print({"exported": exported})


if __name__ == "__main__":
    main()
