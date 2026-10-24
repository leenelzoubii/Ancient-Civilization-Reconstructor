"""Generate docs/ACR-AI-Restorer-Documentation.docx (full report).

Run: python tools/build_restorer_docs.py
"""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "ACR-AI-Restorer-Documentation.docx"


def add_bullets(doc, items):
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def add_numbered(doc, items):
    for item in items:
        doc.add_paragraph(item, style="List Number")


def build():
    doc = Document()

    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    title = doc.add_heading("AI Artifact Restorer — Documentation", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run(
        "Graduation Project — Ancient Civilization Reconstructor\n"
        "Tools, pipeline, and AI integration"
    )
    run.italic = True
    run.font.size = Pt(12)

    # 1. Overview
    doc.add_heading("1. How the AI Works (Overview)", level=1)
    doc.add_paragraph(
        "When you upload a damaged artifact photo, you paint over the cracks and missing "
        "pieces, and that painting becomes a transparency mask telling the AI exactly which "
        "pixels it is allowed to change. The website sends your photo, the mask, and a "
        "repair instruction to OpenAI's image-editing model through a small server-side "
        "function that keeps the API key secret. The model rebuilds only the masked areas "
        "so they look like continuous, undamaged artifact surface, and the site then blends "
        "that repair back into your original photo — everything you did not paint stays "
        "pixel-identical. Automatic checks confirm the damage area actually changed before "
        "the result is shown to you."
    )

    # 2. Pipeline
    doc.add_heading("2. The Pipeline in 3 Steps", level=1)
    add_numbered(
        doc,
        [
            "Prepare — The photo is re-encoded as a true PNG (longest side up to 1024px). "
            "Your brush strokes become a mask at the exact pixel size of the photo, dilated "
            "by about 6px so cracks are fully covered, with about 3px of soft feathering "
            "on the edges for seamless blending.",
            "Repair — The photo + mask + a prompt (\"fill only the masked cracks, match the "
            "surrounding clay/stone texture and lighting exactly\") are sent to OpenAI's "
            "gpt-image-2.5-sunburst model through the POST /v1/images/edits endpoint, via "
            "our /api/restore serverless function. Exactly one paid call per click — no "
            "automatic retries.",
            "Verify and show — The AI image is composited only inside the painted region. "
            "A pixel-difference score must show real change, and an optional second model "
            "(gpt-6-luna) judges whether damage remains. Strong results are badged \"AI "
            "Restored\", doubtful ones are flagged \"may be weak, please inspect\", and "
            "failures show the real error. Nothing is ever hidden or silently retried.",
        ],
    )

    # 3. Tools
    doc.add_heading("3. Tools Used", level=1)
    table = doc.add_table(rows=1, cols=3)
    table.style = "Light Grid Accent 1"
    hdr = table.rows[0].cells
    hdr[0].text = "Layer"
    hdr[1].text = "Tool"
    hdr[2].text = "What it does"
    rows = [
        ("Frontend", "Vite 8", "Build tool and dev server (fast refresh, production bundling)"),
        ("Frontend", "React 19 + TypeScript", "Component UI (pages, tab system, quiz, painter) with type safety"),
        ("Frontend", "Tailwind CSS v4", "All styling via utility classes, plus light/dark theme"),
        ("Frontend", "Canvas painter", "Brush strokes rendered to an offscreen canvas, scaled to true image pixels"),
        ("Frontend", "Sketchfab embeds", "Interactive 3D models (iframes with VR/fullscreen permissions)"),
        ("Frontend", "YouTube embeds", "History videos"),
        ("Data", "Static JSON files", "Database substitute: civilization texts, quiz questions"),
        ("AI layer", "gpt-image-2.5-sunburst", "Image repair model (Image Edits API, quality low in dev / medium in production)"),
        ("AI layer", "gpt-6-luna", "Optional result judge (Chat Completions API, strict JSON schema)"),
        ("AI layer", "POST /v1/images/edits", "OpenAI endpoint: image + transparency mask + prompt → repaired image"),
        ("AI layer", "POST /v1/chat/completions", "OpenAI endpoint: returns repaired: true/false verdict"),
        ("Server", "/api/restore", "Vercel serverless function: validation, rate limit, daily budget, single OpenAI fetch"),
        ("Server", "/api/vision", "Vercel serverless function: optional damage annotation / judge"),
        ("Hosting", "Vercel", "Static site + serverless functions; OpenAI key stored as server-side secret"),
    ]
    for layer, tool, what in rows:
        cells = table.add_row().cells
        cells[0].text = layer
        cells[1].text = tool
        cells[2].text = what

    doc.add_paragraph()
    doc.add_paragraph(
        "The browser never talks to OpenAI directly and never sees the API key; every AI "
        "call goes through the two serverless functions."
    )

    # 4. Deep dive
    doc.add_heading("4. AI Restorer — Detailed Flow", level=1)
    add_numbered(
        doc,
        [
            "Painter — The user uploads a photo and paints the damage. Strokes are drawn on "
            "an overlay canvas and rasterized into an offscreen mask buffer at full image "
            "resolution.",
            "Mask pipeline — The mask is dilated (~6px) so every crack edge is covered, "
            "feathered (~3px) for smooth blending, and alpha-checked (at least 0.1% of the "
            "image must be painted before the AI is called).",
            "Server proxy (/api/restore) — Validates PNG signature, dimensions, mask size "
            "match, mask alpha channel, and the 1024px long-side rule; enforces a rate "
            "limit (10/hour), a daily budget (20/day, in-memory per instance), and keeps "
            "the API key server-side. Mock mode (OPENAI_MOCK=true, disabled in "
            "production) lets all testing run for free.",
            "Single OpenAI call — One fetch to /v1/images/edits per click. Success is "
            "counted only on HTTP 2xx; there is no automatic retry anywhere.",
            "Blend — The returned image is composited strictly inside the painted region; "
            "unpainted pixels are copied from the original, so untouched areas are "
            "pixel-identical.",
            "Verification — A pixel-difference score over the masked area must show real "
            "change (otherwise a fallback repaint is used). Optionally gpt-6-luna judges "
            "the masked crop (enabled only with VITE_VISION_LAYER=true; it annotates only, "
            "never blocks or retries).",
            "Honest display — HTTP 200 results are always shown (weak ones with an amber "
            "note), failures show the real error, and a local basic repair appears only "
            "when the AI call failed AND the painted area is under 5%, clearly badged "
            "\"Local Repair (basic)\".",
        ],
    )

    # 5. Accuracy
    doc.add_heading("5. Why There Is No True Accuracy Score", level=1)
    doc.add_paragraph(
        "A true accuracy percentage requires ground truth — the perfect original image to "
        "compare against. For a randomly broken artifact photo that image does not exist: "
        "there was no training set and no test set; the model is OpenAI's general "
        "pretrained model, not one trained on this data. Two proxies are reported instead, "
        "and neither is accuracy:"
    )
    add_bullets(
        doc,
        [
            "Diff score (e.g. 34.2/255) measures how much changed inside the painted area — "
            "it proves \"something happened\", not \"it is correct\".",
            "Judge verdict (repaired: true/false) is a second AI's opinion and can also be "
            "wrong.",
        ],
    )
    doc.add_paragraph(
        "To obtain a real number (e.g. for the graduation report): build a small test set "
        "of intact artifact photos, synthetically damage copies (draw cracks), restore "
        "them, and compare against the known originals with an image-similarity metric "
        "such as SSIM. That is the honest way to quote accuracy."
    )

    # 6. Costs
    doc.add_heading("6. Costs and Spend Safety", level=1)
    add_bullets(
        doc,
        [
            "Image repair: gpt-image-2.5-sunburst — roughly $0.02 per call at quality "
            "low, ~$0.03 at medium (quality set per environment; xhigh/max are deliberately "
            "not exposed).",
            "Judge (optional): gpt-6-luna — roughly $0.001 per check.",
            "One click = at most one billable image call; no auto-retry (\"Try again\" is a "
            "manual button).",
            "The UI shows the estimated cost before every restore, with an extra "
            "acknowledgement checkbox when more than 15% of the image is painted, plus a "
            "session spend meter.",
            "Server guards: rate limit 10/hour, daily budget 20/day, key never exposed to "
            "the browser, mock mode for free development testing.",
        ],
    )

    # 7. Frontend overview
    doc.add_heading("7. Frontend Overview (Website)", level=1)
    doc.add_paragraph(
        "The site itself is a static single-page application: Vite builds React 19 + "
        "TypeScript sources, Tailwind CSS v4 handles all styling and theming, static JSON "
        "files provide the data (civilizations, quizzes), and Sketchfab/YouTube iframes "
        "supply the 3D models and videos. The only backend pieces are the two Vercel "
        "serverless functions that proxy OpenAI — everything else runs client-side."
    )

    # 8. Credits
    doc.add_heading("8. Credits", level=1)
    add_bullets(
        doc,
        [
            "Mahrah Alyammahi",
            "Afra Al Hamed",
            "Hajar Alsaqqaf",
            "Salama Alhadhrami",
        ],
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(OUT))
    print(f"written: {OUT}")


def verify():
    d = Document(str(OUT))
    headings = [p.text for p in d.paragraphs if p.style.name.startswith("Heading")]
    tables = len(d.tables)
    paras = len(d.paragraphs)
    expected = [
        "1. How the AI Works (Overview)",
        "2. The Pipeline in 3 Steps",
        "3. Tools Used",
        "4. AI Restorer — Detailed Flow",
        "5. Why There Is No True Accuracy Score",
        "6. Costs and Spend Safety",
        "7. Frontend Overview (Website)",
        "8. Credits",
    ]
    missing = [h for h in expected if h not in headings]
    table_rows = sum(len(t.rows) for t in d.tables)
    assert not missing, f"missing headings: {missing}"
    assert tables == 1, f"expected 1 table, got {tables}"
    assert table_rows >= 15, f"expected >=15 table rows, got {table_rows}"
    assert paras >= 35, f"expected >=35 paragraphs, got {paras}"
    print(f"verify ok: {len(headings)} headings, {paras} paragraphs, {tables} table ({table_rows} rows)")


if __name__ == "__main__":
    build()
    verify()
