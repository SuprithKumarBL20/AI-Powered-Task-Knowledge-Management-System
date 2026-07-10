import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document, DocumentChunk, User, ActivityLog
from app.schemas import DocumentResponse
from app.auth import RoleChecker, get_current_user
from app.config import UPLOADS_DIR
from app.services.document_processor import extract_text_from_file, chunk_text
from app.services.vector_store import index_document_chunks

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user), # Any authenticated user
    db: Session = Depends(get_db)
):
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.post("", response_model=DocumentResponse)
def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker(["Admin"])), # Admin only
    db: Session = Depends(get_db)
):
    # Verify file extension
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".txt", ".pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file extension. Only .txt and .pdf files are allowed."
        )
        
    # Save the file locally
    # Sanitize file name to prevent directory traversal
    safe_filename = "".join(c for c in filename if c.isalnum() or c in [".", "_", "-"]).strip()
    # Handle duplicates by adding a suffix if file exists
    base, extension = os.path.splitext(safe_filename)
    counter = 1
    dest_path = UPLOADS_DIR / safe_filename
    while dest_path.exists():
        dest_path = UPLOADS_DIR / f"{base}_{counter}{extension}"
        counter += 1
        
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    # Process text content
    try:
        full_text = extract_text_from_file(str(dest_path))
        chunks = chunk_text(full_text, chunk_size=500, overlap=100)
    except Exception as e:
        # Clean up file on failure
        if dest_path.exists():
            os.remove(dest_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse and process document: {str(e)}"
        )
        
    if not chunks:
        # Clean up file if there is no readable text
        if dest_path.exists():
            os.remove(dest_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file contains no readable text."
        )

    # Save document metadata to database
    new_doc = Document(
        title=title,
        file_path=str(dest_path),
        file_type=ext.upper().replace(".", ""),
        uploaded_by=current_user.id
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Save chunks to database
    db_chunks = []
    for idx, chunk_content in enumerate(chunks):
        db_chunk = DocumentChunk(
            document_id=new_doc.id,
            chunk_text=chunk_content,
            chunk_index=idx
        )
        db.add(db_chunk)
        db_chunks.append(db_chunk)
        
    db.commit()
    # Refresh to load auto-incremented chunk IDs
    for chunk in db_chunks:
        db.refresh(chunk)
        
    # Index the chunks in vector database (FAISS/Fallback)
    try:
        index_document_chunks(db, db_chunks)
    except Exception as e:
        print(f"Error indexing document: {e}")
        # Note: We don't fail the request, we logged it, but the document metadata
        # and database chunks are stored. Fallback search will still find it.
        
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="Document Upload",
        details=f"Admin uploaded document '{title}' ({new_doc.file_type}). Chunks generated: {len(db_chunks)}."
    )
    db.add(log)
    db.commit()
    
    return new_doc

@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    file_path = doc.file_path
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file does not exist on server filesystem"
        )
        
    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type="application/octet-stream"
    )
