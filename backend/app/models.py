from datetime import datetime
import os

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


class TaskApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    college_name = Column(String, nullable=True)

    # Leaderboard ranking fields
    tasks_completed = Column(Integer, default=0, nullable=False)
    tasks_completed_on_time = Column(Integer, default=0, nullable=False)
    rating_sum = Column(Integer, default=0, nullable=False)
    total_ratings = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(scale=2), default=0.0, nullable=False)
    on_time_completion_rate = Column(Numeric(scale=2), default=0.0, nullable=False)
    leaderboard_score = Column(Numeric(scale=2), default=0.0, nullable=False, index=True)

    # Premium tokens
    premium_tokens = Column(Integer, default=0, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)

    # Profile image (Cloudinary URL)
    profile_image_url = Column(String, nullable=True)

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
    task_applications = relationship(
        "TaskApplication",
        back_populates="applicant",
        foreign_keys="TaskApplication.applicant_id",
    )
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def is_admin(self) -> bool:
        """Computed admin access based on configured email allowlist."""
        email = (self.email or "").strip().lower()
        if not email:
            return False

        admin_emails = {
            e.strip().lower()
            for e in os.getenv("ADMIN_EMAILS", "").split(",")
            if e.strip()
        }
        single_admin = (os.getenv("ADMIN_EMAIL", "").strip().lower())
        if single_admin:
            admin_emails.add(single_admin)

        return email in admin_emails


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    replaced_by_token_id = Column(Integer, ForeignKey("refresh_tokens.id"), nullable=True)
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(64), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")
    replaced_by = relationship("RefreshToken", remote_side=[id], uselist=False)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=True)
    reward = Column(Numeric(scale=2), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.open, nullable=False)
    category = Column(String(50), default="paid", nullable=False)
    inter_college_only = Column(Boolean, default=False, nullable=False)
    is_urgent = Column(Boolean, default=False, nullable=False)

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
    messages = relationship("Message", back_populates="task", order_by="Message.timestamp")
    applications = relationship(
        "TaskApplication",
        back_populates="task",
        order_by="TaskApplication.created_at.desc()",
    )


class TaskApplication(Base):
    __tablename__ = "task_applications"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(
        Enum(TaskApplicationStatus),
        default=TaskApplicationStatus.pending,
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    task = relationship("Task", back_populates="applications")
    applicant = relationship("User", back_populates="task_applications", foreign_keys=[applicant_id])


class Message(Base):
    """Chat messages for task-specific rooms. Only owner and assigned user can access."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    file_url = Column(String(500), nullable=True)  # For PDFs/attachments from Cloudinary
    file_name = Column(String(255), nullable=True)  # Original filename
    seen_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


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


class PlatformReview(Base):
    """Reviews about the Skillstreet platform itself (what users think of the platform)."""
    __tablename__ = "platform_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    review_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class ContactFeedback(Base):
    """Contact/feedback submissions from users."""
    __tablename__ = "contact_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # optional if not logged in
    type = Column(String, nullable=False)  # "feedback", "report", "contact"
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

