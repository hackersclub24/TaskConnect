from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    Boolean,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base
import enum


class TaskStatus(str, enum.Enum):
    open = "open"
    accepted = "accepted"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    college_name = Column(String, nullable=True)

    owned_tasks = relationship(
        "Task",
        back_populates="owner",
        foreign_keys="Task.owner_id",
    )
    assigned_tasks = relationship(
        "Task",
        back_populates="assigned_user",
        foreign_keys="Task.assigned_to",
    )
    # Reviews received from others
    reviews_received = relationship(
        "Review",
        back_populates="reviewee",
        foreign_keys="Review.reviewee_id",
    )
    # Reviews written by this user
    reviews_written = relationship(
        "Review",
        back_populates="reviewer",
        foreign_keys="Review.reviewer_id",
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=True)
    reward = Column(Numeric(scale=2), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.open, nullable=False)
    category = Column(String(50), default="paid", nullable=False)
    inter_college_only = Column(Boolean, default=False, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship(
        "User",
        back_populates="owned_tasks",
        foreign_keys=[owner_id],
    )
    assigned_user = relationship(
        "User",
        back_populates="assigned_tasks",
        foreign_keys=[assigned_to],
    )


class Review(Base):
    """User reviews: star rating + text feedback."""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_written")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
    task = relationship("Task", backref="reviews")


class ContactFeedback(Base):
    """Contact/feedback submissions from users."""
    __tablename__ = "contact_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # optional if not logged in
    type = Column(String, nullable=False)  # "feedback", "report", "contact"
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

