from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# --- Role Schemas ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role_id: int

class UserResponse(UserBase):
    id: int
    role: RoleResponse
    created_at: datetime
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: Optional[str] = Field(default="Medium", pattern="^(Low|Medium|High)$")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: str = Field(pattern="^(Pending|Completed)$")

class TaskResponse(TaskBase):
    id: int
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserBase] = None
    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentBase(BaseModel):
    title: str
    file_type: str

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    uploaded_by: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Search Schemas ---
class SearchResultItem(BaseModel):
    document_id: int
    document_title: str
    chunk_text: str
    chunk_index: int
    score: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]

# --- Analytics Schemas ---
class SearchQueryMetric(BaseModel):
    query: str
    count: int

class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_documents: int
    top_queries: List[SearchQueryMetric]
