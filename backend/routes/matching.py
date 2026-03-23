from fastapi import APIRouter, HTTPException
from backend import store

router = APIRouter(prefix="/match", tags=["matching"])

@router.get("/gap/{email}/{internship_id}")
def get_skill_gap(email: str, internship_id: int):
    student = store.get_profile(email)
    internship = store.get_internship(internship_id)
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    return store.compute_match(student["skills"], internship["required_skills"])

@router.get("/students/{internship_id}")
def match_students(internship_id: int):
    internship = store.get_internship(internship_id)
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
        
    students = store.get_all_students_with_profiles()
    results = []
    for s in students:
        match_info = store.compute_match(s["skills"], internship["required_skills"])
        results.append({
            "student_email": s["email"],
            "full_name": s["full_name"],
            "match_percentage": match_info["match_percentage"],
            "matched_skills": match_info["matched_skills"],
            "missing_skills": match_info["missing"]
        })
    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results
