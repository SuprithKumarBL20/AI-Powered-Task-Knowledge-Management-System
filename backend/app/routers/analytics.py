from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Task, Document, ActivityLog, User
from app.schemas import AnalyticsResponse
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total tasks count
    total_tasks = db.query(Task).count()
    
    # Completed vs Pending count
    completed_tasks = db.query(Task).filter(Task.status == "Completed").count()
    pending_tasks = db.query(Task).filter(Task.status == "Pending").count()
    
    # Total documents count
    total_documents = db.query(Document).count()
    
    # Most searched queries (group by search query details)
    # The queries are logged as Action='Search' with query text in 'details'
    top_searches_query = db.query(
        ActivityLog.details.label("query"),
        func.count(ActivityLog.id).label("count")
    ).filter(
        ActivityLog.action == "Search",
        ActivityLog.details != None,
        ActivityLog.details != ""
    ).group_by(
        ActivityLog.details
    ).order_by(
        func.count(ActivityLog.id).desc()
    ).limit(5).all()
    
    top_queries = [
        {"query": row.query, "count": row.count}
        for row in top_searches_query
    ]
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "total_documents": total_documents,
        "top_queries": top_queries
    }

@router.get("/logs")
def get_activity_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(50).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else "System",
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at
        }
        for log in logs
    ]
