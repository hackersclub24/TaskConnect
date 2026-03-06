from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import TaskStatus


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None
    skills: Optional[str] = None
    college_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    phone: Optional[str] = None
    skills: Optional[str] = None
    college_name: Optional[str] = None

    class Config:
        orm_mode = True


class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    reward: Optional[float] = None
    category: Optional[str] = "paid"
    inter_college_only: Optional[bool] = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    reward: Optional[float] = None
    category: Optional[str] = None
    inter_college_only: Optional[bool] = None


class TaskUpdateStatus(BaseModel):
    status: TaskStatus


class TaskOwnerBrief(BaseModel):
    """Brief owner info for task cards (includes college for 'From Your College' badge)."""
    id: int
    college_name: Optional[str] = None

    class Config:
        orm_mode = True


class TaskOut(TaskBase):
    id: int
    status: TaskStatus
    owner_id: int
    assigned_to: Optional[int] = None
    created_at: datetime
    owner: Optional[TaskOwnerBrief] = None

    class Config:
        orm_mode = True


class TaskContacts(BaseModel):
    owner_phone: Optional[str] = None
    acceptor_phone: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    skills: Optional[str] = None


class RecommendedFreelancerOut(BaseModel):
    freelancer: UserPublic
    match_percentage: int


class RecommendedTaskOut(BaseModel):
    task: TaskOut
    match_percentage: int


class ProposalOut(BaseModel):
    proposal: str



class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- Review schemas ---
class ReviewCreate(BaseModel):
    reviewee_id: int
    task_id: Optional[int] = None
    rating: int  # 1-5
    text: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    reviewer_id: int
    reviewee_id: int
    task_id: Optional[int] = None
    rating: int
    text: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class ReviewWithReviewer(ReviewOut):
    reviewer_email: Optional[str] = None


# --- Contact/Feedback schemas ---
class ContactFeedbackCreate(BaseModel):
    type: str  # "feedback", "report", "contact"
    subject: str
    message: str


class ContactFeedbackOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    type: str
    subject: str
    message: str
    created_at: datetime

    class Config:
        orm_mode = True

