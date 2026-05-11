from fastapi import APIRouter, HTTPException, Header, Response
from pydantic import BaseModel
from typing import Optional
import pyotp
import qrcode
import io
from backend.store import (
    register_user, login_user, create_token, decode_token,
    update_profile, get_profile,
    create_internship, get_all_internships, get_employer_internships,
    apply_to_internship, get_applicants, update_application_status,
    get_student_applications, compute_match, get_user, update_user_role, get_all_users_safe,
    get_notifications, mark_notifications_read,
    set_user_otp_secret, enable_user_otp, disable_user_otp
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
    major: Optional[str] = ""

class SocialLoginRequest(BaseModel):
    provider: str
    email: str
    full_name: str
    role: str = "student"

class Login2FARequest(BaseModel):
    email: str
    otp_code: str

class Verify2FARequest(BaseModel):
    otp_code: str

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
    result = register_user(req.email, req.password, req.full_name, req.role)
    if "error" in result:
        raise HTTPException(status_code=409, detail=result["error"])
    token = create_token({"sub": req.email, "role": req.role, "full_name": req.full_name})
    return {"access_token": token, "token_type": "bearer", "role": req.role}

@router.post("/login")
def login(req: LoginRequest):
    user = login_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # 2FA Check: if enabled, don't issue token yet. Signal to UI to ask for OTP.
    if user["otp_enabled"]:
        return {"2fa_required": True, "email": user["email"]}

    token = create_token({"sub": user["email"], "role": user["role"], "full_name": user["full_name"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}

@router.post("/login/2fa")
def login_2fa(req: Login2FARequest):
    user = get_user(req.email)
    if not user or not user["otp_enabled"] or not user["otp_secret"]:
        raise HTTPException(status_code=401, detail="2FA not enabled or user not found")

    totp = pyotp.TOTP(user["otp_secret"])
    if not totp.verify(req.otp_code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    token = create_token({"sub": user["email"], "role": user["role"], "full_name": user["full_name"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}

@router.post("/social-login")
def social_login(req: SocialLoginRequest):
    user = get_user(req.email)
    if not user:
        # Auto-register new user from social provider
        register_user(req.email, "SocialLoginSecurePass123!", req.full_name, req.role)
        user = get_user(req.email)
    
    # Check 2FA even for social login (adds security points)
    if user["otp_enabled"]:
        return {"2fa_required": True, "email": user["email"]}

    token = create_token({"sub": user["email"], "role": user["role"], "full_name": user["full_name"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"], "email": user["email"]}

@router.get("/me")
def me(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    user = get_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": user["email"], "full_name": user["full_name"], "role": user["role"], "otp_enabled": user["otp_enabled"]}

# ─── Two-Factor Authentication (2FA) ──────────────────────────────────────────

@router.get("/2fa/setup")
def setup_2fa(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    user_email = payload["sub"]

    # Generate a new secret and store it for the user
    secret = pyotp.random_base32()
    set_user_otp_secret(user_email, secret)

    # Create provisioning URI for authenticator apps
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user_email, issuer_name="InternConnect")

    # Generate QR code image in memory
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")

@router.post("/2fa/verify")
def verify_2fa(req: Verify2FARequest, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    user = get_user(payload["sub"])
    if not user or not user["otp_secret"]:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")

    totp = pyotp.TOTP(user["otp_secret"])
    if not totp.verify(req.otp_code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code. Please try again.")

    enable_user_otp(user["email"])
    return {"ok": True, "detail": "2FA has been successfully enabled!"}

@router.post("/2fa/disable")
def disable_2fa(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    disable_user_otp(payload["sub"])
    return {"ok": True, "detail": "2FA has been disabled."}

# ─── Admin Dashboard ──────────────────────────────────────────────────────────

class RoleUpdate(BaseModel):
    new_role: str

@router.get("/admin/users")
def fetch_all_users(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Admins only")
    return get_all_users_safe()

@router.patch("/admin/users/{email}/role")
def change_user_role(email: str, req: RoleUpdate, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Admins only")
    if payload.get("sub") == email:
        raise HTTPException(status_code=400, detail="Admins cannot change their own role.")
    return update_user_role(email, req.new_role)

# ─── Student profile ──────────────────────────────────────────────────────────

@router.put("/profile")
def set_profile(req: ProfileUpdate, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    result = update_profile(payload["sub"], req.bio, req.skills, req.major)
    return result

@router.get("/profile")
def fetch_profile(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    return get_profile(payload["sub"])

# ─── Internships ──────────────────────────────────────────────────────────────

class InternshipInput(BaseModel):
    title: str
    description: str
    required_skills: list  # [{"name": str, "level": int}]
    work_hours: Optional[str] = ""
    work_mode: Optional[str] = ""
    hourly_pay: Optional[str] = ""
    payment_methods: Optional[str] = ""
    location: Optional[str] = ""

@router.post("/internships")
def post_internship(req: InternshipInput, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can post internships")
    return create_internship(req.title, req.description, req.required_skills, payload["sub"], req.work_hours, req.work_mode, req.hourly_pay, req.payment_methods, req.location)

@router.get("/internships")
def list_internships():
    return get_all_internships()

@router.get("/internships/my")
def my_internships(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    return get_employer_internships(payload["sub"])

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
def update_status(internship_id: int, student_email: str, status: str, e_signature: Optional[str] = "", authorization: str = Header(...)):
    payload = get_current_user(authorization)
    if payload["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can update status")
    result = update_application_status(internship_id, student_email, status, e_signature)
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

@router.get("/internships/{internship_id}/match")
def match_me(internship_id: int, authorization: str = Header(...)):
    payload = get_current_user(authorization)
    profile = get_profile(payload["sub"])
    from backend.store import get_internship
    intern = get_internship(internship_id)
    if not intern:
        raise HTTPException(status_code=404, detail="Internship not found")
    return compute_match(profile.get("skills", []), intern.get("required_skills", []))

# ─── Notifications ────────────────────────────────────────────────────────────

@router.get("/notifications")
def fetch_notifications(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    return get_notifications(payload["sub"])

@router.post("/notifications/read")
def read_notifications(authorization: str = Header(...)):
    payload = get_current_user(authorization)
    mark_notifications_read(payload["sub"])
    return {"ok": True}
