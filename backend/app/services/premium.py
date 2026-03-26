"""
Premium features and token management.

Tokens are ONLY used for:
- Premium content unlocking
- Premium feature access

NOT for general payments or other transactions.
"""
from sqlalchemy.orm import Session
from .. import models


# Token costs for premium features
TOKEN_COSTS = {
    "ai_resume_review": 10,
    "priority_matching": 5,
    "early_task_access": 0,  # Free check, tracked separately
}


def get_user_token_balance(db: Session, user_id: int) -> int:
    """Get user's current premium token balance."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user.premium_tokens if user else 0


def has_enough_tokens(db: Session, user_id: int, required_tokens: int) -> bool:
    """Check if user has enough tokens for premium feature."""
    balance = get_user_token_balance(db, user_id)
    return balance >= required_tokens


def deduct_tokens(db: Session, user_id: int, amount: int, feature_name: str) -> bool:
    """
    Deduct tokens for premium feature access.

    Returns True if successful, False if insufficient tokens.
    Only deducts tokens for PREMIUM FEATURES - never for regular payments.
    """
    if amount not in TOKEN_COSTS.values() + [0]:
        # Extra safety: only allow known premium feature costs
        raise ValueError(f"Invalid token cost: {amount}")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.premium_tokens < amount:
        return False

    user.premium_tokens -= amount
    db.commit()
    return True


def add_tokens(db: Session, user_id: int, amount: int) -> bool:
    """Add tokens to user account (e.g., admin operations, purchases)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False

    user.premium_tokens += amount
    db.commit()
    return True


def unlock_premium_feature(db: Session, user_id: int, feature_name: str) -> dict:
    """
    Check and deduct tokens for premium feature access.

    Returns:
    {
        "allowed": bool,
        "current_tokens": int,
        "required_tokens": int,
        "message": str
    }
    """
    if feature_name not in TOKEN_COSTS:
        return {
            "allowed": False,
            "current_tokens": get_user_token_balance(db, user_id),
            "required_tokens": 0,
            "message": f"Unknown feature: {feature_name}"
        }

    required = TOKEN_COSTS[feature_name]
    current = get_user_token_balance(db, user_id)

    if current < required:
        return {
            "allowed": False,
            "current_tokens": current,
            "required_tokens": required,
            "message": f"Insufficient tokens. Need {required}, have {current}"
        }

    # Deduct tokens
    success = deduct_tokens(db, user_id, required, feature_name)

    if success:
        return {
            "allowed": True,
            "current_tokens": current - required,
            "required_tokens": required,
            "message": f"Successfully unlocked {feature_name}"
        }
    else:
        return {
            "allowed": False,
            "current_tokens": current,
            "required_tokens": required,
            "message": "Token deduction failed"
        }
