from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import TaskStatus


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    college_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    college_name: Optional[str] = None

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    phone: Optional[str] = None


class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    reward: Optional[float] = None
    category: Optional[str] = "paid"
    inter_college_only: Optional[bool] = False
    is_urgent: Optional[bool] = False


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

    is_urgent: Optional[bool] = False

    class Config:
        orm_mode = True

class UrgentTaskOut(BaseModel):
    task_id: int
    title: str
    description: str
    deadline: Optional[datetime] = None
    posted_by: str
    required_skill: Optional[str] = None
    urgency_status: str
    priority_score: Optional[float] = None
    
    class Config:
        orm_mode = True


class TaskContacts(BaseModel):
    owner_phone: Optional[str] = None
    acceptor_phone: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    name: Optional[str] = None
    email: EmailStr
    bio: Optional[str] = None
    skills: Optional[str] = None


class LeaderboardUserOut(BaseModel):
    id: int
    name: Optional[str] = None
    email: EmailStr
    rank: int
    tasks_completed: int
    average_rating: float
    leaderboard_score: float

    class Config:
        from_attributes = True




class RecommendedFreelancerOut(BaseModel):
    freelancer: UserPublic
    match_percentage: int


class RecommendedTaskOut(BaseModel):
    task: TaskOut
    match_percentage: int


class ProposalOut(BaseModel):
    proposal: str


class UserStatsOut(BaseModel):
    total_posted: int
    total_completed: int
    total_accepted: int
    posted_tasks: list[TaskOut]
    accepted_tasks: list[TaskOut]



class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class GoogleTokenIn(BaseModel):
    token: str


class GoogleAuthResponse(BaseModel):
    success: bool = True
    user: UserOut
    access_token: str
    token_type: str = "bearer"


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
# --- Chat/Message schemas ---
class MessageOut(BaseModel):
    id: int
    task_id: int
    sender_id: int
    sender_email: Optional[str] = None
    message: str
    timestamp: datetime

    class Config:
        orm_mode = True


class MessageCreate(BaseModel):
    message: str


# --- Platform reviews (reviews about the platform itself) ---
class PlatformReviewCreate(BaseModel):
    rating: int  # 1-5
    review_text: str


class PlatformReviewOut(BaseModel):
    id: int
    user_id: int
    rating: int
    review_text: str
    created_at: datetime
    user_email: Optional[str] = None

    class Config:
        orm_mode = True


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

