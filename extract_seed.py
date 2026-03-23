import json
from backend.seed import ALL_SKILLS, STUDENTS, EMPLOYERS, INTERNSHIPS, applications

with open('backend/seed_data.json', 'w') as f:
    json.dump({
        "ALL_SKILLS": ALL_SKILLS,
        "STUDENTS": STUDENTS,
        "EMPLOYERS": EMPLOYERS,
        "INTERNSHIPS": INTERNSHIPS,
        "APPLICATIONS": applications
    }, f, indent=2)
print("Extracted to backend/seed_data.json")
