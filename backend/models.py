from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class StudentCreate(UserBase):
    password: str
    bio: Optional[str] = None

class CompanyCreate(UserBase):
    password: str
    company_name: str
    industry: str
    description: Optional[str] = None

class Skill(BaseModel):
    name: str = Field(..., description="Name of the skill, e.g., 'Python'")
    domain: Optional[str] = Field(None, description="E.g., 'Backend', 'DataScience'")

class InternshipCreate(BaseModel):
    title: str
    description: str

class StudentSkillMatch(BaseModel):
    skill_name: str
    level: int = Field(default=1, ge=1, le=5) # 1 to 5

class InternshipSkillRequirement(BaseModel):
    skill_name: str
    level_required: int = Field(default=1, ge=1, le=5)
