from fastapi import APIRouter, Depends, HTTPException
from backend.repositories.match_repo import MatchRepository

router = APIRouter(prefix="/match", tags=["matching"])

def get_match_repo():
    return MatchRepository()

@router.get("/gap/{username}/{internship_title}")
def get_skill_gap(username: str, internship_title: str, repo: MatchRepository = Depends(get_match_repo)):
    return repo.get_skill_gap(username, internship_title)

@router.get("/students/{internship_title}")
def match_students(internship_title: str, repo: MatchRepository = Depends(get_match_repo)):
    return repo.match_students_to_internship(internship_title)
