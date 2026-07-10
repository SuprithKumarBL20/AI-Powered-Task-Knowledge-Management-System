import os
from pypdf import PdfReader

def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text content from TXT or PDF files.
    """
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
            
    elif ext == ".pdf":
        try:
            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
            
    else:
        raise ValueError(f"Unsupported file extension: {ext}. Only .txt and .pdf are allowed.")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    """
    Splits text into chunks of chunk_size with some overlap.
    """
    if not text:
        return []
        
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        # Advance by chunk_size minus overlap, ensuring we make progress
        start += max(chunk_size - overlap, 1)
        
    return chunks
