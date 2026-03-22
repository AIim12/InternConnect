from fastapi import APIRouter, Depends
from backend.repositories.match_repo import MatchRepository
from backend.models import InternshipCreate

router = APIRouter(prefix="/internships", tags=["internships"])

def get_match_repo():
    return MatchRepository()

@router.post("/")
def create_internship(internship: InternshipCreate, repo: MatchRepository = Depends(get_match_repo)):
    return repo.create_internship(internship.title)

@router.post("/{title}/requirements")
def add_requirement(title: str, skill_name: str, level_required: int = 1, repo: MatchRepository = Depends(get_match_repo)):
    return repo.add_internship_requirement(title, skill_name, level_required)

@router.post("/{title}/apply/{username}")
def apply_to_internship(title: str, username: str, status: str = "Applied", repo: MatchRepository = Depends(get_match_repo)):
    return repo.apply_to_internship(username, title, status)
