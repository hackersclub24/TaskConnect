"""
Premium features endpoints.

Token usage:
- Tokens are ONLY deducted for premium feature access
- NO token usage for general payments or other transactions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..services.premium import (
    unlock_premium_feature,
    get_user_token_balance,
    TOKEN_COSTS,
)

router = APIRouter()


@router.get("/token-balance", response_model=schemas.TokenBalanceOut)
def get_token_balance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get user's premium token balance."""
    return {
        "balance": current_user.premium_tokens,
        "is_premium": current_user.is_premium
    }


@router.post("/ai-resume-review", response_model=schemas.PremiumFeatureGateOut)
def access_ai_resume_review(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Unlock AI resume review feature (costs 10 tokens).

    After unlocking, user can submit resume for AI analysis.
    """
    result = unlock_premium_feature(db, current_user.id, "ai_resume_review")

    if not result["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=result["message"]
        )

    return result


@router.post("/priority-matching", response_model=schemas.PremiumFeatureGateOut)
def access_priority_matching(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Unlock priority task matching (costs 5 tokens).

    After unlocking, user gets advanced matching algorithm for better recommendations.
    """
    result = unlock_premium_feature(db, current_user.id, "priority_matching")

    if not result["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=result["message"]
        )

    return result


@router.get("/feature-costs")
def get_feature_costs():
    """Get token costs for all premium features."""
    return {
        feature: cost
        for feature, cost in TOKEN_COSTS.items()
        if cost > 0  # Only show features that cost tokens
    }
