"""
MySQL-backed persistent store for InternConnect.
Database: internconnect_db
User: root
Password: RootPass@1212
"""
import pymysql
import bcrypt as _bcrypt
import jwt
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

SECRET_KEY = "supersecretkey_internconnect_2026"
ALGORITHM = "HS256"

# ─── Database Configuration ───────────────────────────────────────────────────

DB_HOST = os.getenv("DB_HOST") or "127.0.0.1"
DB_USER = os.getenv("DB_USER") or "root"
DB_PASSWORD = os.getenv("DB_PASSWORD") or "RootPass@1212"
DB_NAME = os.getenv("DB_NAME") or "internconnect"
DB_PORT = int(os.getenv("DB_PORT") or 3306)

# ─── Connection Helper ────────────────────────────────────────────────────────

def _get_connection():
    """Get a fresh MySQL connection"""
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        autocommit=True,
        charset='utf8mb4'
    )

# ─── Database Initialization ─────────────────────────────────────────────────

def init_db():
    """Create database and tables if they don't exist"""
    try:
        # First, ensure database exists
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            autocommit=True,
            charset='utf8mb4'
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn.close()
        
        # Now connect to the database
        conn = _get_connection()
        with conn.cursor() as cursor:
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    email VARCHAR(255) PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    password TEXT NOT NULL,
                    role ENUM('student', 'employer') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Student profiles
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS student_profiles (
                    email VARCHAR(255) PRIMARY KEY,
                    bio TEXT,
                    skills JSON,
                    profile_picture LONGBLOB,
                    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
                )
            """)
            
            # Employer profiles
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS employer_profiles (
                    email VARCHAR(255) PRIMARY KEY,
                    company_name VARCHAR(255),
                    company_bio TEXT,
                    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
                )
            """)
            
            # Internships
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS internships (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    required_skills JSON,
                    employer_email VARCHAR(255) NOT NULL,
                    hourly_rate DECIMAL(10, 2),
                    working_hours VARCHAR(255),
                    remote BOOLEAN DEFAULT FALSE,
                    status VARCHAR(50) DEFAULT 'published',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employer_email) REFERENCES users(email) ON DELETE CASCADE
                )
            """)
            
            # Applications
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS applications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    internship_id INT NOT NULL,
                    student_email VARCHAR(255) NOT NULL,
                    status VARCHAR(50) DEFAULT 'Applied',
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE,
                    UNIQUE KEY unique_application (internship_id, student_email)
                )
            """)
            
            # Messages
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_email VARCHAR(255) NOT NULL,
                    receiver_email VARCHAR(255) NOT NULL,
                    content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_email) REFERENCES users(email) ON DELETE CASCADE,
                    FOREIGN KEY (receiver_email) REFERENCES users(email) ON DELETE CASCADE
                )
            """)
            
            # Notifications
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_email VARCHAR(255) NOT NULL,
                    title VARCHAR(255),
                    content TEXT,
                    read_status BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
                )
            """)
            
            # Saved jobs
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS saved_jobs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_email VARCHAR(255) NOT NULL,
                    internship_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE,
                    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_saved (student_email, internship_id)
                )
            """)
        
        conn.close()
        print("✅ MySQL database initialized successfully")
        
    except pymysql.Error as e:
        print(f"❌ MySQL Error: {e}")
        raise

# ─── User Management ──────────────────────────────────────────────────────────

def register_user(email: str, full_name: str, password: str, role: str) -> dict:
    """Register a new user"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            # Check if user exists
            cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                conn.close()
                return {"error": "User already exists"}
            
            # Hash password
            hashed = _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()
            
            # Insert user
            cursor.execute(
                "INSERT INTO users (email, full_name, password, role) VALUES (%s, %s, %s, %s)",
                (email, full_name, hashed, role)
            )
            
            # Create profile based on role
            if role == "student":
                cursor.execute(
                    "INSERT INTO student_profiles (email, bio, skills) VALUES (%s, %s, %s)",
                    (email, "", json.dumps([]))
                )
            else:
                cursor.execute(
                    "INSERT INTO employer_profiles (email, company_name, company_bio) VALUES (%s, %s, %s)",
                    (email, "", "")
                )
        
        conn.close()
        return {"ok": True}
    except Exception as e:
        return {"error": str(e)}

def login_user(email: str, password: str) -> dict:
    """Authenticate user"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT password, role FROM users WHERE email = %s", (email,))
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                return {"error": "Invalid credentials"}
            
            stored_hash, role = result
            if not _bcrypt.checkpw(password.encode(), stored_hash.encode()):
                return {"error": "Invalid credentials"}
            
            return {"ok": True, "role": role}
    except Exception as e:
        return {"error": str(e)}

def get_user(email: str) -> Optional[dict]:
    """Get user info"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT email, full_name, role FROM users WHERE email = %s", (email,))
            result = cursor.fetchone()
        conn.close()
        return result
    except Exception:
        return None

# ─── Tokens ───────────────────────────────────────────────────────────────────

def create_token(email: str, role: str) -> str:
    """Create JWT token"""
    payload = {
        "sub": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=15),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    """Decode JWT token"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None

# ─── Student Profile ──────────────────────────────────────────────────────────

def get_profile(email: str) -> dict:
    """Get student profile"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT email, bio, skills FROM student_profiles WHERE email = %s", (email,))
            result = cursor.fetchone()
        conn.close()
        
        if result:
            result['skills'] = json.loads(result['skills']) if result['skills'] else []
            return result
        return {"email": email, "bio": "", "skills": []}
    except Exception:
        return {"email": email, "bio": "", "skills": []}

def update_profile(email: str, bio: str = None, skills: list = None, profile_picture=None) -> dict:
    """Update student profile"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            if bio is not None:
                cursor.execute("UPDATE student_profiles SET bio = %s WHERE email = %s", (bio, email))
            if skills is not None:
                cursor.execute("UPDATE student_profiles SET skills = %s WHERE email = %s", 
                             (json.dumps(skills), email))
            if profile_picture is not None:
                cursor.execute("UPDATE student_profiles SET profile_picture = %s WHERE email = %s", 
                             (profile_picture, email))
        conn.close()
        return get_profile(email)
    except Exception as e:
        return {"error": str(e)}

# ─── Employer Profile ─────────────────────────────────────────────────────────

def get_employer_profile(email: str) -> dict:
    """Get employer profile"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT email, company_name, company_bio FROM employer_profiles WHERE email = %s", (email,))
            result = cursor.fetchone()
        conn.close()
        
        if result:
            return result
        return {"email": email, "company_name": "", "company_bio": ""}
    except Exception:
        return {"email": email, "company_name": "", "company_bio": ""}

def update_employer_profile(email: str, company_name: str, company_bio: str) -> dict:
    """Update employer profile"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE employer_profiles SET company_name = %s, company_bio = %s WHERE email = %s",
                (company_name, company_bio, email)
            )
        conn.close()
        return get_employer_profile(email)
    except Exception as e:
        return {"error": str(e)}

# ─── Internships ──────────────────────────────────────────────────────────────

def create_internship(title: str, description: str, required_skills: list, employer_email: str,
                     hourly_rate: float = None, working_hours: str = None, remote: bool = False) -> dict:
    """Create internship"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO internships (title, description, required_skills, employer_email, hourly_rate, working_hours, remote)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (title, description, json.dumps(required_skills), employer_email, hourly_rate, working_hours, remote)
            )
            internship_id = cursor.lastrowid
        conn.close()
        return get_internship(internship_id)
    except Exception as e:
        return {"error": str(e)}

def get_all_internships() -> list:
    """Get all internships"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM internships ORDER BY created_at DESC")
            results = cursor.fetchall()
        conn.close()
        
        for r in results:
            r['required_skills'] = json.loads(r['required_skills']) if r['required_skills'] else []
        return results
    except Exception:
        return []

def get_internship(internship_id: int) -> Optional[dict]:
    """Get internship by ID"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM internships WHERE id = %s", (internship_id,))
            result = cursor.fetchone()
        conn.close()
        
        if result:
            result['required_skills'] = json.loads(result['required_skills']) if result['required_skills'] else []
            return result
        return None
    except Exception:
        return None

def get_employer_internships(employer_email: str) -> list:
    """Get internships for employer"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM internships WHERE employer_email = %s ORDER BY created_at DESC", (employer_email,))
            results = cursor.fetchall()
        conn.close()
        
        for r in results:
            r['required_skills'] = json.loads(r['required_skills']) if r['required_skills'] else []
        return results
    except Exception:
        return []

def update_internship(internship_id: int, title: str = None, description: str = None,
                     required_skills: list = None, hourly_rate: float = None,
                     working_hours: str = None, remote: bool = None) -> dict:
    """Update internship"""
    try:
        conn = _get_connection()
        updates = []
        values = []
        
        if title is not None:
            updates.append("title = %s")
            values.append(title)
        if description is not None:
            updates.append("description = %s")
            values.append(description)
        if required_skills is not None:
            updates.append("required_skills = %s")
            values.append(json.dumps(required_skills))
        if hourly_rate is not None:
            updates.append("hourly_rate = %s")
            values.append(hourly_rate)
        if working_hours is not None:
            updates.append("working_hours = %s")
            values.append(working_hours)
        if remote is not None:
            updates.append("remote = %s")
            values.append(remote)
        
        if updates:
            values.append(internship_id)
            with conn.cursor() as cursor:
                cursor.execute(f"UPDATE internships SET {', '.join(updates)} WHERE id = %s", tuple(values))
        
        conn.close()
        return get_internship(internship_id)
    except Exception as e:
        return {"error": str(e)}

def delete_internship(internship_id: int, employer_email: str) -> dict:
    """Delete internship"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT employer_email FROM internships WHERE id = %s", (internship_id,))
            result = cursor.fetchone()
            
            if not result or result[0] != employer_email:
                conn.close()
                return {"error": "Unauthorized"}
            
            cursor.execute("DELETE FROM internships WHERE id = %s", (internship_id,))
        conn.close()
        return {"ok": True}
    except Exception as e:
        return {"error": str(e)}

# ─── Applications ─────────────────────────────────────────────────────────────

def apply_to_internship(internship_id: int, student_email: str) -> dict:
    """Apply to internship"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO applications (internship_id, student_email, status) VALUES (%s, %s, %s)",
                         (internship_id, student_email, "Applied"))
            application_id = cursor.lastrowid
        conn.close()
        return {"ok": True, "id": application_id}
    except pymysql.IntegrityError:
        return {"error": "Already applied"}
    except Exception as e:
        return {"error": str(e)}

def get_applicants(internship_id: int) -> list:
    """Get applicants for internship"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT a.id, a.student_email, a.status, a.message, u.full_name, sp.bio, sp.skills
                FROM applications a
                JOIN users u ON a.student_email = u.email
                LEFT JOIN student_profiles sp ON a.student_email = sp.email
                WHERE a.internship_id = %s
            """, (internship_id,))
            results = cursor.fetchall()
        conn.close()
        
        for r in results:
            r['skills'] = json.loads(r['skills']) if r['skills'] else []
        return results
    except Exception:
        return []

def get_student_applications(student_email: str) -> list:
    """Get applications for student"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT a.id, a.internship_id, a.status, a.message, a.created_at,
                       i.title, i.description, i.hourly_rate, i.required_skills
                FROM applications a
                JOIN internships i ON a.internship_id = i.id
                WHERE a.student_email = %s
                ORDER BY a.created_at DESC
            """, (student_email,))
            results = cursor.fetchall()
        conn.close()
        
        for r in results:
            r['required_skills'] = json.loads(r['required_skills']) if r['required_skills'] else []
        return results
    except Exception:
        return []

def update_application_status(internship_id: int, student_email: str, status: str, message: str = None) -> dict:
    """Update application status"""
    try:
        conn = _get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE applications SET status = %s, message = %s WHERE internship_id = %s AND student_email = %s",
                (status, message, internship_id, student_email)
            )
        conn.close()
        return {"ok": True}
    except Exception as e:
        return {"error": str(e)}

# ─── Matching ──────────────────────────────────────────────────────────────────

def compute_match(student_skills: list, required_skills: list) -> dict:
    """Compute skill match percentage"""
    if not required_skills:
        return {"match_percentage": 100, "missing": []}
    
    required_names = [s.get("name") if isinstance(s, dict) else s for s in required_skills]
    student_skill_names = [s.lower() if isinstance(s, str) else s.get("name", "").lower() for s in student_skills]
    
    matched = sum(1 for skill in required_names if skill.lower() in student_skill_names)
    missing = [s for s in required_names if s.lower() not in student_skill_names]
    
    percentage = int((matched / len(required_names)) * 100) if required_names else 100
    
    return {
        "match_percentage": percentage,
        "missing": missing
    }

# ─── Admin Data Export ────────────────────────────────────────────────────────

def get_all_users_safe() -> list:
    """Get all users (without passwords)"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT email, full_name, role FROM users")
            results = cursor.fetchall()
        conn.close()
        return results
    except Exception:
        return []

def get_all_applications() -> list:
    """Get all applications"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM applications")
            results = cursor.fetchall()
        conn.close()
        return results
    except Exception:
        return []

def get_all_students_with_profiles() -> list:
    """Get all students with their profiles"""
    try:
        conn = _get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT u.email, u.full_name, sp.bio, sp.skills
                FROM users u
                LEFT JOIN student_profiles sp ON u.email = sp.email
                WHERE u.role = 'student'
            """)
            results = cursor.fetchall()
        conn.close()
        
        for r in results:
            if r.get('skills'):
                r['skills'] = json.loads(r['skills'])
        return results
    except Exception:
        return []
