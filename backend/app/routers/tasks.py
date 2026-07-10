from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Task, User, Role, ActivityLog
from app.schemas import TaskCreate, TaskResponse, TaskUpdate
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch current user's role
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "User"
    
    query = db.query(Task)
    
    # Both Admin and standard User can view all tasks in the system.
    # If a filter by assignee is requested (via query param), apply it.
    if assigned_to is not None:
        query = query.filter(Task.assigned_to == assigned_to)
            
    # Apply dynamic filters
    if status is not None:
        query = query.filter(Task.status == status)
    if priority is not None:
        query = query.filter(Task.priority == priority)
        
    return query.order_by(Task.created_at.desc()).all()

@router.post("", response_model=TaskResponse)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(RoleChecker(["Admin"])), # Admin only
    db: Session = Depends(get_db)
):
    # If assigned_to is provided, verify the assignee exists
    if task_data.assigned_to is not None:
        assignee = db.query(User).filter(User.id == task_data.assigned_to).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignee user with ID {task_data.assigned_to} not found"
            )
            
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        status="Pending",
        priority=task_data.priority or "Medium",
        assigned_to=task_data.assigned_to,
        created_by=current_user.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Log the action
    assignee_str = f"assigned to user ID {task_data.assigned_to}" if task_data.assigned_to else "unassigned"
    log = ActivityLog(
        user_id=current_user.id,
        action="Task Create ",
        details=f"Admin created task '{new_task.title}' ({assignee_str})."
    )
    db.add(log)
    db.commit()
    
    return new_task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
        
    # RBAC logic: Users can only update their own tasks. Admins can update any.
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "User"
    
    # Standard users can update the status of any task in their task list.
    pass
        
    old_status = task.status
    task.status = status_update.status
    db.commit()
    db.refresh(task)
    
    # Log the action
    log = ActivityLog(
        user_id=current_user.id,
        action="Task Update",
        details=f"Updated task '{task.title}' status from '{old_status}' to '{task.status}'."
    )
    db.add(log)
    db.commit()
    
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    
    task_title = task.title
    db.delete(task)
    db.commit()
    
    # Log the action
    log = ActivityLog(
        user_id=current_user.id,
        action="Task Delete",
        details=f"Admin deleted task '{task_title}' (ID {task_id})."
    )
    db.add(log)
    db.commit()
    
    return None
