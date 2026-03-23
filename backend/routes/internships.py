from fastapi import APIRouter, HTTPException, Depends
from backend import store
from backend.models import InternshipCreate
from pydantic import BaseModel

class Requirement(BaseModel):
    skill_name: str
    level_required: int = 1

router = APIRouter(prefix="/internships", tags=["internships"])

@router.post("/")
def create_internship(internship: InternshipCreate):
    # Fallback employer_email if none provided (demo purposes)
    result = store.create_internship(
        title=internship.title,
        description=internship.description or "No description provided",
        required_skills=[],
        employer_email=internship.employer_email or "hr@techcorp.com"
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create internship")
    return {"message": "Internship created", "internship": result}

@router.post("/{internship_id}/apply/{student_email}")
def apply_to_internship(internship_id: int, student_email: str):
    res = store.apply_to_internship(internship_id, student_email)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return {"message": "Applied successfully"}
