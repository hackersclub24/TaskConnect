from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable


_WORD_RE = re.compile(r"[a-z0-9]+", re.IGNORECASE)

_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "can",
    "for",
    "from",
    "have",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "with",
    "you",
    "your",
}


def tokenize(text: str | None) -> list[str]:
    if not text:
        return []
    words = [w.lower() for w in _WORD_RE.findall(text)]
    return [w for w in words if w not in _STOPWORDS and len(w) > 1]


def cosine_similarity(a_tokens: Iterable[str], b_tokens: Iterable[str]) -> float:
    a = Counter(a_tokens)
    b = Counter(b_tokens)
    if not a or not b:
        return 0.0

    common = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in common)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def match_percentage(task_text: str, skills_text: str) -> int:
    score = cosine_similarity(tokenize(task_text), tokenize(skills_text))
    # A tiny boost helps demos feel less "all zeros" for short texts.
    boosted = min(1.0, score * 1.15)
    return max(0, min(100, int(round(boosted * 100))))

