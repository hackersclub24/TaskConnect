from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProposalContext:
    task_title: str
    task_description: str
    freelancer_skills: str


def generate_proposal(ctx: ProposalContext) -> str:
    """
    Simple, clean proposal generator that can later be swapped with an LLM.
    """
    title = (ctx.task_title or "").strip()
    desc = (ctx.task_description or "").strip()
    skills = (ctx.freelancer_skills or "").strip()

    skill_line = f"I have experience with {skills}." if skills else "I have relevant experience for this work."
    task_hint = f" regarding “{title}”" if title else ""
    short_desc = desc[:140].strip()
    detail_line = f"I reviewed the details{task_hint} and can start immediately." if short_desc else f"I can help{task_hint} and start immediately."

    return (
        "Hi,\n\n"
        f"{skill_line} {detail_line} "
        "I’ll communicate clearly, share progress updates, and deliver before the deadline.\n\n"
        "Thanks!"
    )

