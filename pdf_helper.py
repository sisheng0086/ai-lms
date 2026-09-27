import os
import subprocess
import re

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
WORKSPACE_DIR = r"c:\Users\Daniel\.gemini\antigravity\scratch\final_project"

def render_html_to_pdf(html_path, pdf_path, doc_title="Technical Study Guide"):
    url_path = "file:///" + os.path.abspath(html_path).replace("\\", "/")
    
    footer_html = f"""<div style="font-size:7.5pt; width:100%; display:flex; justify-content:space-between; padding:0 14mm; color:#64748b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <span><strong>{doc_title}</strong> &bull; Technical Reference</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>"""
    
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={os.path.abspath(pdf_path)}",
        '--header-template=<div></div>',
        f'--footer-template={footer_html}',
        url_path
    ]
    print(f"Rendering {html_path} -> {pdf_path}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
        with open(pdf_path, 'rb') as f:
            data = f.read()
        pages = len(re.findall(rb'/Type\s*/Page\b', data))
        print(f"Successfully generated: {pdf_path} ({pages} pages, {os.path.getsize(pdf_path):,} bytes)")
        return True, pages
    else:
        print(f"Error rendering PDF: {res.stderr}")
        return False, 0

if __name__ == "__main__":
    print("PDF helper loaded.")
