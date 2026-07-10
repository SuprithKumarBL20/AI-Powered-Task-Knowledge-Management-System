from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ActivityLog
from app.schemas import SearchResponse
from app.auth import get_current_user
from app.services.vector_store import search_documents

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=SearchResponse)
def search(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not q or not q.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty"
        )
        
    # Search document chunks semantically (AI) or fallback (TF-IDF)
    try:
        results = search_documents(db, q, k=5)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing search: {str(e)}"
        )
        
    # Log the search query in activity logs
    # We store the exact search query in details to easily aggregate it in analytics
    log = ActivityLog(
        user_id=current_user.id,
        action="Search",
        details=q.strip()
    )
    db.add(log)
    db.commit()
    
    return {
        "query": q,
        "results": results
    }
