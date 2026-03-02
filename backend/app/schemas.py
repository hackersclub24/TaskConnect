from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import TaskStatus


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    reward: Optional[float] = None


class TaskCreate(TaskBase):
    pass


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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None

