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


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    phone: Optional[str] = None
    skills: Optional[str] = None

    class Config:
        orm_mode = True


class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    reward: Optional[float] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    reward: Optional[float] = None


class TaskUpdateStatus(BaseModel):
    status: TaskStatus


class TaskOut(TaskBase):
    id: int
    status: TaskStatus
    owner_id: int
    assigned_to: Optional[int] = None
    created_at: datetime

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

