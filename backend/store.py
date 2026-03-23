"""
SQLite-backed persistent store.
Data file: InternConnectGraph/data.db
Zero extra dependencies — sqlite3 is built into Python.
"""
import sqlite3
import bcrypt as _bcrypt
import jwt
import json
from datetime import datetime, timedelta
from pathlib import Path

SECRET_KEY = "supersecretkey_internconnect_2026"
ALGORITHM = "HS256"

DB_PATH = Path(__file__).parent.parent / "data.db"

# ─── Connection ───────────────────────────────────────────────────────────────

def _conn():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con

# ─── Schema bootstrap (runs once on startup) ─────────────────────────────────

def init_db():
    with _conn() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            email      TEXT PRIMARY KEY,
            full_name  TEXT NOT NULL,
            password   TEXT NOT NULL,
            role       TEXT NOT NULL CHECK(role IN ('student','employer'))
        );

        CREATE TABLE IF NOT EXISTS student_profiles (
            email  TEXT PRIMARY KEY REFERENCES users(email),
            bio    TEXT DEFAULT '',
            skills TEXT DEFAULT '[]'   -- JSON list of skill-name strings
        );

        CREATE TABLE IF NOT EXISTS internships (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            title            TEXT NOT NULL,
            description      TEXT,
            required_skills  TEXT DEFAULT '[]',  -- JSON [{name, level}]
            work_hours       TEXT DEFAULT '',
            work_mode        TEXT DEFAULT '',
            hourly_pay       TEXT DEFAULT '',
            payment_methods  TEXT DEFAULT '',
            location         TEXT DEFAULT '',
            employer_email   TEXT REFERENCES users(email),
            created_at       TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS applications (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            internship_id   INTEGER REFERENCES internships(id),
            student_email   TEXT REFERENCES users(email),
            status          TEXT DEFAULT 'Applied',
            UNIQUE(internship_id, student_email)
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT REFERENCES users(email),
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        """)

# ─── Password helpers ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password[:72].encode(), _bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain[:72].encode(), hashed.encode())

# ─── JWT helpers ──────────────────────────────────────────────────────────────

def create_token(data: dict) -> str:
    payload = {**data, "exp": datetime.utcnow() + timedelta(hours=12)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

# ─── User operations ──────────────────────────────────────────────────────────

def register_user(email: str, password: str, full_name: str, role: str) -> dict:
    try:
        with _conn() as con:
            con.execute(
                "INSERT INTO users (email, full_name, password, role) VALUES (?,?,?,?)",
                (email, full_name, hash_password(password), role)
            )
            if role == "student":
                con.execute(
                    "INSERT INTO student_profiles (email) VALUES (?)", (email,)
                )
        return {"ok": True}
    except sqlite3.IntegrityError:
        return {"error": "Email already registered"}

def login_user(email: str, password: str):
    with _conn() as con:
        row = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row:
        return None
    if not verify_password(password, row["password"]):
        return None
    return dict(row)

def get_user(email: str):
    with _conn() as con:
        row = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    return dict(row) if row else None

# ─── Student profile ──────────────────────────────────────────────────────────

def update_profile(email: str, bio: str, skills: list) -> dict:
    with _conn() as con:
        con.execute(
            "INSERT INTO student_profiles (email, bio, skills) VALUES (?,?,?) "
            "ON CONFLICT(email) DO UPDATE SET bio=excluded.bio, skills=excluded.skills",
            (email, bio, json.dumps(skills))
        )
    return {"bio": bio, "skills": skills}

def get_profile(email: str) -> dict:
    with _conn() as con:
        row = con.execute("SELECT * FROM student_profiles WHERE email=?", (email,)).fetchone()
    if not row:
        return {"bio": "", "skills": []}
    return {"bio": row["bio"] or "", "skills": json.loads(row["skills"] or "[]")}

# ─── Internship operations ────────────────────────────────────────────────────

def create_internship(title: str, description: str, required_skills: list, employer_email: str, work_hours: str = "", work_mode: str = "", hourly_pay: str = "", payment_methods: str = "", location: str = "") -> dict:
    with _conn() as con:
        cur = con.execute(
            "INSERT INTO internships (title, description, required_skills, employer_email, work_hours, work_mode, hourly_pay, payment_methods, location) VALUES (?,?,?,?,?,?,?,?,?)",
            (title, description, json.dumps(required_skills), employer_email, work_hours, work_mode, hourly_pay, payment_methods, location)
        )
        row = con.execute("SELECT * FROM internships WHERE id=?", (cur.lastrowid,)).fetchone()
    return _parse_internship(row) if row else None

def get_internship(id: int) -> dict | None:
    with _conn() as con:
        row = con.execute("SELECT * FROM internships WHERE id=?", (id,)).fetchone()
    return _parse_internship(row) if row else None

def get_all_internships() -> list:
    with _conn() as con:
        rows = con.execute("SELECT * FROM internships ORDER BY id DESC").fetchall()
    return [_parse_internship(r) for r in rows]

def get_employer_internships(employer_email: str) -> list:
    with _conn() as con:
        rows = con.execute(
            "SELECT * FROM internships WHERE employer_email=? ORDER BY id DESC",
            (employer_email,)
        ).fetchall()
    return [_parse_internship(r) for r in rows]

def _parse_internship(row) -> dict:
    d = dict(row)
    d["required_skills"] = json.loads(d["required_skills"] or "[]")
    return d

# ─── Application operations ───────────────────────────────────────────────────

def apply_to_internship(internship_id: int, student_email: str) -> dict:
    try:
        with _conn() as con:
            con.execute(
                "INSERT INTO applications (internship_id, student_email) VALUES (?,?)",
                (internship_id, student_email)
            )
        return {"ok": True}
    except sqlite3.IntegrityError:
        return {"error": "Already applied"}

def get_applicants(internship_id: int) -> list:
    with _conn() as con:
        rows = con.execute("""
            SELECT a.student_email AS email, a.status,
                   u.full_name, p.bio, p.skills
            FROM applications a
            JOIN users u ON u.email = a.student_email
            LEFT JOIN student_profiles p ON p.email = a.student_email
            WHERE a.internship_id = ?
        """, (internship_id,)).fetchall()
    result = []
    for r in rows:
        result.append({
            "email": r["email"],
            "full_name": r["full_name"],
            "status": r["status"],
            "bio": r["bio"] or "",
            "skills": json.loads(r["skills"] or "[]"),
        })
    return result

def update_application_status(internship_id: int, student_email: str, status: str, e_signature: str = "") -> dict:
    with _conn() as con:
        rows_changed = con.execute(
            "UPDATE applications SET status=? WHERE internship_id=? AND student_email=?",
            (status, internship_id, student_email)
        ).rowcount
        if rows_changed and status == 'Offered':
            job = con.execute("SELECT title, employer_email FROM internships WHERE id=?", (internship_id,)).fetchone()
            if job:
                msg = f"🎉 Congratulations! You have been approved and offered the '{job['title']}' internship by {job['employer_email']}."
                if e_signature:
                    msg += f"\n\n🖋️ Official E-Signature: {e_signature}"
                con.execute("INSERT INTO notifications (user_email, message) VALUES (?, ?)", (student_email, msg))
                
    return {"ok": True} if rows_changed else {"error": "Application not found"}

def get_student_applications(student_email: str) -> list:
    with _conn() as con:
        rows = con.execute("""
            SELECT i.*, a.status
            FROM applications a
            JOIN internships i ON i.id = a.internship_id
            WHERE a.student_email = ?
        """, (student_email,)).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["required_skills"] = json.loads(d["required_skills"] or "[]")
        result.append(d)
    return result

# ─── Notifications ────────────────────────────────────────────────────────────

def get_notifications(email: str) -> list:
    with _conn() as con:
        rows = con.execute("SELECT * FROM notifications WHERE user_email=? ORDER BY id DESC", (email,)).fetchall()
    return [dict(r) for r in rows]

def mark_notifications_read(email: str):
    with _conn() as con:
        con.execute("UPDATE notifications SET is_read=1 WHERE user_email=?", (email,))


# ─── Smart Match ──────────────────────────────────────────────────────────────

def compute_match(student_skills: list, required_skills: list) -> dict:
    if not required_skills:
        return {"match_percentage": 100, "matched_skills": [], "missing": []}
    student_set = {s.lower() for s in student_skills}
    matched = [r for r in required_skills if r["name"].lower() in student_set]
    missing = [r for r in required_skills if r["name"].lower() not in student_set]
    pct = round((len(matched) / len(required_skills)) * 100)
    return {
        "match_percentage": pct,
        "matched_skills": [r["name"] for r in matched],
        "missing": [r["name"] for r in missing],
    }

# ─── Admin helpers ────────────────────────────────────────────────────────────

def get_all_users_safe() -> list:
    with _conn() as con:
        rows = con.execute("SELECT email, full_name, role FROM users").fetchall()
    return [dict(r) for r in rows]

def get_all_applications() -> list:
    with _conn() as con:
        rows = con.execute("""
            SELECT a.id, a.internship_id, a.student_email, a.status,
                   i.title AS internship_title
            FROM applications a JOIN internships i ON i.id=a.internship_id
        """).fetchall()
    return [dict(r) for r in rows]

def get_all_students_with_profiles() -> list:
    with _conn() as con:
        rows = con.execute("""
            SELECT u.email, u.full_name, p.bio, p.skills
            FROM users u
            LEFT JOIN student_profiles p ON p.email = u.email
            WHERE u.role = 'student'
        """).fetchall()
    result = []
    for r in rows:
        result.append({
            "email": r["email"],
            "full_name": r["full_name"],
            "bio": r["bio"] or "",
            "skills": json.loads(r["skills"] or "[]"),
        })
    return result
