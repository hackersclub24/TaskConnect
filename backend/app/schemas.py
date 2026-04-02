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
    slug: str
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    college_name: Optional[str] = None
    premium_tokens: int = 0
    is_premium: bool = False
    is_admin: bool = False
    profile_image_url: Optional[str] = None

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    phone: Optional[str] = None
    college_name: Optional[str] = None


class ProfileImageUpdate(BaseModel):
    profile_image_url: str


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


class TaskRewardNegotiationIn(BaseModel):
    reward: float


class TaskOwnerBrief(BaseModel):
    """Brief owner info for task cards (includes college for 'From Your College' badge)."""
    id: int
    slug: Optional[str] = None
    college_name: Optional[str] = None

    class Config:
        orm_mode = True


class TaskOut(TaskBase):
    id: int
    slug: str
    status: TaskStatus
    owner_id: int
    assigned_to: Optional[int] = None
    created_at: datetime
    owner: Optional[TaskOwnerBrief] = None
    assigned_user: Optional[TaskOwnerBrief] = None

    is_urgent: Optional[bool] = False
    premium_early_access: Optional[bool] = False

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
    slug: Optional[str] = None
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
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class GoogleTokenIn(BaseModel):
    token: str


class GoogleAuthResponse(BaseModel):
    success: bool = True
    user: UserOut
    access_token: str
    refresh_token: Optional[str] = None
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
    sender_name: Optional[str] = None
    message: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    seen_at: Optional[datetime] = None
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


# --- Token/Premium schemas ---
class TokenBalanceOut(BaseModel):
    balance: int
    is_premium: bool = False


class TokenDeductionRequest(BaseModel):
    tokens_amount: int
    feature_name: str


class PremiumFeatureGateOut(BaseModel):
    allowed: bool
    current_tokens: int
    required_tokens: int
    message: Optional[str] = None


class TaskApplicationOut(BaseModel):
    id: int
    task_id: int
    applicant_id: int
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class AdminTaskOut(BaseModel):
    id: int
    slug: str
    title: str
    status: TaskStatus
    owner_id: int
    owner_email: Optional[EmailStr] = None
    assigned_to: Optional[int] = None
    message_count: int = 0
    attachment_count: int = 0
    created_at: datetime

    class Config:
        orm_mode = True

