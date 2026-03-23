from fastapi import APIRouter, HTTPException
from backend import store
from backend.models import Skill

router = APIRouter(prefix="/skills", tags=["skills"])

@router.post("/{skill1}/related/{skill2}")
def link_skills(skill1: str, skill2: str):
    return store.add_skill_relationship(skill1, skill2)

@router.post("/student/{email}")
def add_student_skill(email: str, skill_name: str, level: int = 1):
    profile = store.get_profile(email)
    skills = profile["skills"]
    if skill_name not in skills:
        skills.append(skill_name)
        store.update_profile(email, profile["bio"], skills)
    return {"message": "Skill added", "skills": skills}
