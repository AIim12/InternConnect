from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from backend.store import (
    register_user, login_user, create_token, decode_token,
    update_profile, get_profile, update_employer_profile, get_employer_profile,
    create_internship, update_internship, delete_internship,
    get_all_internships, get_employer_internships,
    apply_to_internship, get_applicants, update_application_status,
    get_student_applications, compute_match, get_user
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ─── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # "student" | "employer"

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    bio: Optional[str] = ""
    skills: Optional[list] = []  # list of skill name strings

class EmployerProfileUpdate(BaseModel):
    company_name: str
    company_bio: Optional[str] = ""

class InternshipInput(BaseModel):
    title: str
    description: str
    required_skills: list  # [{"name": str, "level": int}]
    hourly_rate: Optional[float] = None
    working_hours: Optional[str] = None
    remote: Optional[bool] = False

class InternshipUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[list] = None
    hourly_rate: Optional[float] = None
    working_hours: Optional[str] = None
    remote: Optional[bool] = None

class ApplicationStatusUpdate(BaseModel):
    status: str
    message: Optional[str] = None

# ─── Auth helpers ─────────────────────────────────────────────────────────────

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalid or expired")

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest):
    result = register_user(req.email, req.full_name, req.password, req.role)
    if "error" in result:
        raise HTTPException(status_code=409, detail=result["error"])
    token = create_token(req.email, req.role)
    return {"access_token": token, "token_type": "bearer", "role": req.role}

@router.post("/login")
def login(req: LoginRequest):
    result = login_user(req.email, req.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    user = get_user(req.email)
    token = create_token(req.email, result["role"])
    return {"access_token": token, "token_type": "bearer", "role": result["role"]}

@router.get("/me")
def me(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    user = get_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": user["email"], "full_name": user["full_name"], "role": user["role"]}

# ─── Student profile ──────────────────────────────────────────────────────────

@router.put("/profile")
def set_profile(req: ProfileUpdate, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    result = update_profile(payload["sub"], req.bio, req.skills)
    return result

@router.get("/profile")
def fetch_profile(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    return get_profile(payload["sub"])

# ─── Employer profile ──────────────────────────────────────────────────────────

@router.put("/employer/profile")
def set_employer_profile(req: EmployerProfileUpdate, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can update company profile")
    result = update_employer_profile(payload["sub"], req.company_name, req.company_bio)
    return result

@router.get("/employer/profile")
def fetch_employer_profile(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can fetch company profile")
    return get_employer_profile(payload["sub"])

# ─── Internships ──────────────────────────────────────────────────────────────

@router.post("/internships")
def post_internship(req: InternshipInput, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can post internships")
    return create_internship(req.title, req.description, req.required_skills, payload["sub"],
                            req.hourly_rate, req.working_hours, req.remote)

@router.get("/internships")
def list_internships():
    return get_all_internships()

@router.get("/internships/my")
def my_internships(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    return get_employer_internships(payload["sub"])

@router.patch("/internships/{internship_id}")
def update_intn(internship_id: int, req: InternshipUpdate, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can update internships")
    result = update_internship(internship_id, req.title, req.description, req.required_skills,
                              req.hourly_rate, req.working_hours, req.remote)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.delete("/internships/{internship_id}")
def delete_intn(internship_id: int, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can delete internships")
    result = delete_internship(internship_id, payload["sub"])
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

# ─── Applications ─────────────────────────────────────────────────────────────

@router.post("/internships/{internship_id}/apply")
def apply(internship_id: int, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can apply")
    result = apply_to_internship(internship_id, payload["sub"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/internships/{internship_id}/applicants")
def applicants(internship_id: int, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can view applicants")
    return get_applicants(internship_id)

@router.patch("/internships/{internship_id}/applicants/{student_email}")
def update_status(internship_id: int, student_email: str, req: ApplicationStatusUpdate, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can update status")
    result = update_application_status(internship_id, student_email, req.status, req.message)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/applications/me")
def my_applications(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    apps = get_student_applications(payload["sub"])
    profile = get_profile(payload["sub"])
    # Enrich each application with match percentage
    enriched = []
    for app in apps:
        match = compute_match(profile.get("skills", []), app.get("required_skills", []))
        enriched.append({**app, **match})
    return enriched
