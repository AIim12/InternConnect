from fastapi import APIRouter, Depends
from backend.repositories.match_repo import MatchRepository
from backend.models import Skill

router = APIRouter(prefix="/skills", tags=["skills"])

def get_match_repo():
    return MatchRepository()

@router.post("/")
def create_skill(skill: Skill, repo: MatchRepository = Depends(get_match_repo)):
    return repo.create_skill(skill.name, skill.domain)

@router.post("/{skill1}/related/{skill2}")
def link_skills(skill1: str, skill2: str, repo: MatchRepository = Depends(get_match_repo)):
    return repo.link_related_skills(skill1, skill2)

@router.post("/student/{username}")
def add_student_skill(username: str, skill_name: str, level: int = 1, repo: MatchRepository = Depends(get_match_repo)):
    return repo.add_student_skill(username, skill_name, level)
