import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, matching, skills, internships, graph
from store import init_db, get_all_users_safe, get_all_internships, get_all_applications, get_all_students_with_profiles
from contextlib import asynccontextmanager

# Load environment variables from backend/.env if present
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("✅ SQLite database initialised at data.db")
    yield

app = FastAPI(title="InternConnect Graph API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(matching.router)
app.include_router(skills.router)
app.include_router(internships.router)
app.include_router(graph.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to InternConnect Graph API"}

@app.get("/admin/data", tags=["admin"])
def admin_data():
    """Dev-only: see all persisted data at once."""
    return {
        "users": get_all_users_safe(),
        "student_profiles": get_all_students_with_profiles(),
        "internships": get_all_internships(),
        "applications": get_all_applications(),
    }
