"""
seed.py — Populates data.db with rich demo data.
Run once: python -m backend.seed
Safe to re-run: clears all data first, then reseeds.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.store import (
    init_db, _conn, register_user, update_profile,
    create_internship, apply_to_internship, update_application_status
)

import json

# ─────────────────────────────────────────────────────────────────────────────
# SEED FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def seed():
    init_db()

    # Clear all tables
    con = _conn()
    with con.cursor() as cur:
        # Disable foreign key checks temporarily to allow deletion in any order
        cur.execute("SET FOREIGN_KEY_CHECKS = 0")
        cur.execute("DELETE FROM applications")
        cur.execute("DELETE FROM internships")
        cur.execute("DELETE FROM student_profiles")
        cur.execute("DELETE FROM users")
        cur.execute("DELETE FROM skill_relationships")
        cur.execute("SET FOREIGN_KEY_CHECKS = 1")
        print("🗑️  Cleared existing data.")
    con.close()

    with open(os.path.join(os.path.dirname(__file__), "seed_data.json")) as f:
        data = json.load(f)

    EMPLOYERS = data["EMPLOYERS"]
    STUDENTS = data["STUDENTS"]
    INTERNSHIPS = data["INTERNSHIPS"]
    ALL_SKILLS = data["ALL_SKILLS"]
    applications = data["APPLICATIONS"]

    # Register employers
    for e in EMPLOYERS:
        register_user(e["email"], e["password"], e["full_name"], "employer")
    print(f"✅ Created {len(EMPLOYERS)} employer accounts.")

    # Register students and their profiles
    for s in STUDENTS:
        register_user(s["email"], s["password"], s["full_name"], "student")
        update_profile(s["email"], s["bio"], s["skills"])
    print(f"✅ Created {len(STUDENTS)} student accounts with profiles and skills.")

    # Create internships
    created_internships = []
    for i in INTERNSHIPS:
        result = create_internship(i["title"], i["description"], i["required_skills"], i["employer"])
        created_internships.append(result)
    print(f"✅ Created {len(INTERNSHIPS)} internship postings.")

    # Seed applications
    for student_email, intern_idx, status in applications:
        intern_id = created_internships[intern_idx]["id"]
        apply_to_internship(intern_id, student_email)
        if status != "Applied":
            update_application_status(intern_id, student_email, status)
    print(f"✅ Created {len(applications)} applications with realistic statuses.")

    flat_skills = [s for skills in ALL_SKILLS.values() for s in skills]

    print("\n🎉 Seed complete! Here are the demo accounts:\n")
    print("━━━━ STUDENTS ━━━━")
    for s in STUDENTS:
        print(f"  {s['email']}  /  password: pass1234")
    print("\n━━━━ EMPLOYERS ━━━━")
    for e in EMPLOYERS:
        print(f"  {e['email']}  /  password: pass1234")
    print(f"\n📊 Total skills available in the system: {len(flat_skills)}")
    print(f"   Categories: {', '.join(ALL_SKILLS.keys())}")

if __name__ == "__main__":
    seed()

