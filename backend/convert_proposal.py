import os
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_proposal_docx():
    md_path = r"C:\Users\Daniel\.gemini\antigravity\scratch\final_project\project_proposal.md"
    if not os.path.exists(md_path):
        print(f"Error: Markdown file not found at {md_path}")
        return

    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc = Document()

    # Define PKS Margin Settings (Left: 3.5cm, Right: 2.0cm, Top/Bottom: 2.5cm)
    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(3.5)
        section.right_margin = Cm(2.0)

    # Style Defaults (Times New Roman, 12pt, 1.5 Spacing, Justified)
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(12)
    font_normal.color.rgb = RGBColor(0x33, 0x33, 0x33)
    
    # Process sections split by Markdown page break "---"
    pages = content.split("---")
    
    for page_idx, page in enumerate(pages):
        page = page.strip()
        if not page:
            continue
            
        lines = page.split("\n")
        in_table = False
        table_headers = []
        table_rows = []

        for line in lines:
            line_str = line.strip()
            
            # Handle Table Parsing
            if line_str.startswith("|"):
                if "---" in line_str:
                    # Skip separator line
                    continue
                cells = [c.strip() for c in line.split("|")[1:-1]]
                if not in_table:
                    in_table = True
                    table_headers = cells
                else:
                    table_rows.append(cells)
                continue
            elif in_table:
                # We finished parsing a table, let's render it in docx
                in_table = False
                render_table(doc, table_headers, table_rows)
                table_headers = []
                table_rows = []

            # Skip empty lines
            if not line_str:
                continue

            # Skip Mermaid Diagram Blocks (handled dynamically or descriptively in Word)
            if line_str.startswith("```"):
                continue
            if "graph TD" in line_str or "flowchart LR" in line_str or "-->" in line_str:
                continue

            # Heading 1 (e.g., # Title, # FINAL YEAR PROJECT PROPOSAL)
            if line_str.startswith("# "):
                text = line_str[2:].replace("**", "")
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(text)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(16)
                run.bold = True
                p.paragraph_format.space_before = Pt(12)
                p.paragraph_format.space_after = Pt(12)

            # Heading 2 (e.g., ## Title, ## TABLE OF CONTENTS)
            elif line_str.startswith("## "):
                text = line_str[3:].replace("**", "")
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(text)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(14)
                run.bold = True
                p.paragraph_format.space_before = Pt(12)
                p.paragraph_format.space_after = Pt(12)

            # Heading 3 / Chapter headings (e.g., ### 1.0 INTRODUCTION)
            elif line_str.startswith("### "):
                text = line_str[4:].replace("**", "")
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                run = p.add_run(text)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(12)
                run.bold = True
                p.paragraph_format.space_before = Pt(12)
                p.paragraph_format.space_after = Pt(6)

            # List Items (e.g., * Item, - Item)
            elif line_str.startswith("* ") or line_str.startswith("- "):
                text = line_str[2:]
                p = doc.add_paragraph(style='List Bullet')
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                p.paragraph_format.line_spacing = 1.5
                parse_inline_formatting(p, text)

            # Ordered lists (e.g. 1. Item)
            elif re.match(r'^\d+\.\s', line_str):
                text = re.sub(r'^\d+\.\s', '', line_str)
                p = doc.add_paragraph(style='List Number')
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                p.paragraph_format.line_spacing = 1.5
                parse_inline_formatting(p, text)

            # Normal Paragraphs
            else:
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                p.paragraph_format.line_spacing = 1.5
                p.paragraph_format.space_after = Pt(6)
                
                # Check for center-aligned text in template cover pages
                if page_idx == 0 or "PREPARED BY" in line_str or "PREPARED FOR" in line_str or "SESSION" in line_str or "DIPLOMA IN" in line_str:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                
                parse_inline_formatting(p, line_str)

        # If a page had a table at the end, render it
        if in_table:
            render_table(doc, table_headers, table_rows)

        # Add page break between pages (except for the last page)
        if page_idx < len(pages) - 1:
            doc.add_page_break()

    # Save outputs
    project_dir = r"C:\Users\Daniel\.gemini\antigravity\scratch\final_project"
    docx_name = "project_proposal.docx"
    
    local_path = os.path.join(project_dir, docx_name)
    doc.save(local_path)
    print(f"Successfully saved Word Document locally to: {local_path}")

    # Copy to Desktop
    try:
        desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
        desktop_path = os.path.join(desktop_dir, docx_name)
        doc.save(desktop_path)
        print(f"Successfully saved Word Document to Desktop: {desktop_path}")
    except Exception as e:
        print(f"Could not save to Desktop directly: {e}")

def parse_inline_formatting(paragraph, text):
    # Matches bold formatting **text**
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith("**") and part.endswith("**"):
            clean_text = part[2:-2]
            run = paragraph.add_run(clean_text)
            run.bold = True
        else:
            paragraph.add_run(part)

def render_table(doc, headers, rows):
    if not headers:
        return
    
    # Create Table
    num_cols = len(headers)
    table = doc.add_table(rows=1, cols=num_cols)
    table.style = 'Light Shading Accent 1'
    
    # Header cells
    hdr_cells = table.rows[0].cells
    for i in range(num_cols):
        hdr_cells[i].text = headers[i]
        set_cell_background(hdr_cells[i], "1E293B")  # Dark blue background
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                run.bold = True
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10)
                
    # Body rows
    for row_data in rows:
        row_cells = table.add_row().cells
        # If row has fewer columns, pad it
        for i in range(min(num_cols, len(row_data))):
            row_cells[i].text = row_data[i]
            for p in row_cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(10)
                    
    doc.add_paragraph().paragraph_format.space_before = Pt(12)

if __name__ == "__main__":
    create_proposal_docx()
