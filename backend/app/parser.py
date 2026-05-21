import os
import pdfplumber
from pypdf import PdfReader
from typing import Tuple

def extract_text_from_txt(file_path: str) -> str:
    """Reads a plain text file."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read().strip()

def extract_text_from_pdf(file_path: str) -> Tuple[str, bool]:
    """
    Extracts text from a PDF file using pdfplumber, falling back to pypdf.
    Returns a tuple of (extracted_text, is_scanned).
    """
    text = ""
    try:
        # Try pdfplumber first for better structural text rendering
        with pdfplumber.open(file_path) as pdf:
            pages_text = []
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text(layout=True)
                if page_text:
                    pages_text.append(page_text)
            text = "\n--- Page Separator ---\n".join(pages_text)
    except Exception as e:
        print(f"pdfplumber failed: {e}. Falling back to pypdf.")
        text = ""

    # Fallback to pypdf if pdfplumber extracted nothing or failed
    if not text.strip():
        try:
            reader = PdfReader(file_path)
            pages_text = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text)
            text = "\n--- Page Separator ---\n".join(pages_text)
        except Exception as e:
            print(f"pypdf fallback failed: {e}")
            text = ""

    # Determine if the PDF is scanned (empty text after cleanups)
    is_scanned = len(text.strip()) < 50
    return text.strip(), is_scanned

def extract_text_from_docx(file_path: str) -> str:
    """Extracts text paragraphs and table cells from Microsoft Word DOCX files."""
    try:
        import docx
    except ImportError:
        raise ImportError("python-docx package is not installed. Add it to requirements.txt.")
        
    doc = docx.Document(file_path)
    content = []
    
    for para in doc.paragraphs:
        if para.text.strip():
            content.append(para.text)
            
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                content.append(" | ".join(row_cells))
                
    return "\n".join(content).strip()

def extract_content(file_path: str) -> Tuple[str, bool]:
    """
    Unified entrypoint to extract content based on file extension.
    Returns (extracted_text, is_scanned_or_image).
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.txt':
        return extract_text_from_txt(file_path), False
    elif ext == '.docx':
        return extract_text_from_docx(file_path), False
    elif ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg']:
        # For images, we can't extract local text easily without heavy local OCR tools.
        # We flag it as visual/scanned, meaning the extractor should use visual LLMs.
        return "", True
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
