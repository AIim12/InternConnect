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

# ─────────────────────────────────────────────────────────────────────────────
# SKILLS (130+ across all fields)
# ─────────────────────────────────────────────────────────────────────────────
ALL_SKILLS = {
    "Information Technology": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
        "PHP", "Ruby", "Swift", "Kotlin", "Dart", "Scala", "R", "MATLAB",
        "React", "Vue.js", "Angular", "Next.js", "Svelte", "Node.js", "Express",
        "FastAPI", "Django", "Flask", "Spring Boot", "Laravel", "Rails",
        "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "Firebase",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git", "GitHub CI/CD",
        "REST API", "GraphQL", "WebSockets", "Microservices", "gRPC",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn",
        "Data Science", "Pandas", "NumPy", "Data Visualization", "Tableau", "Power BI",
        "Cybersecurity", "Penetration Testing", "Network Security", "Ethical Hacking",
        "Blockchain", "Smart Contracts", "Solidity", "Web3",
        "Unity", "Unreal Engine", "Game Development",
        "iOS Development", "Android Development", "Flutter", "React Native",
        "DevOps", "Terraform", "Ansible", "CI/CD", "Nginx", "Apache",
        "Computer Vision", "NLP", "Prompt Engineering", "LangChain",
        "UI/UX Design", "Figma", "Adobe XD",
    ],
    "Business & Finance": [
        "Financial Analysis", "Financial Modeling", "Accounting", "Auditing",
        "Budgeting", "Forecasting", "Excel (Advanced)", "SAP", "QuickBooks",
        "Investment Analysis", "Portfolio Management", "Risk Management",
        "Corporate Finance", "Valuation", "M&A Analysis",
        "Business Strategy", "Market Research", "Competitive Analysis",
        "Project Management", "Agile", "Scrum", "PMP Certification",
        "Business Development", "Sales Strategy", "CRM", "Salesforce",
        "Supply Chain Management", "Logistics", "Procurement",
        "Entrepreneurship", "Startup Pitch", "Lean Methodology",
        "Economics", "Microeconomics", "Macroeconomics", "Econometrics",
    ],
    "Marketing & Communications": [
        "Digital Marketing", "SEO", "SEM", "Google Ads", "Social Media Marketing",
        "Content Marketing", "Copywriting", "Email Marketing", "HubSpot",
        "Brand Strategy", "Public Relations", "Media Planning",
        "Graphic Design", "Adobe Photoshop", "Adobe Illustrator", "Canva",
        "Video Editing", "Adobe Premiere Pro", "After Effects", "DaVinci Resolve",
        "Photography", "Content Creation", "Podcasting", "YouTube Strategy",
        "Market Research", "Consumer Behavior", "Storytelling",
        "Event Management", "Campaign Management", "Influencer Marketing",
    ],
    "Healthcare & Sciences": [
        "Clinical Research", "Laboratory Techniques", "Medical Writing",
        "Pharmacology", "Bioinformatics", "Genomics", "CRISPR",
        "Patient Care", "Electronic Health Records (EHR)", "Medical Coding",
        "Public Health", "Epidemiology", "Biostatistics",
        "Chemistry", "Organic Chemistry", "Biochemistry", "Microbiology",
        "Physics", "Biology", "Environmental Science", "Ecology",
        "Nutrition Science", "Exercise Physiology", "Mental Health Counseling",
    ],
    "Engineering": [
        "Mechanical Design", "CAD (SolidWorks)", "AutoCAD", "FEA Simulation",
        "Electrical Engineering", "Circuit Design", "PCB Layout", "MATLAB/Simulink",
        "Civil Engineering", "Structural Analysis", "Revit", "BIM",
        "Chemical Engineering", "Process Engineering", "P&ID",
        "Robotics", "Embedded Systems", "Arduino", "Raspberry Pi", "ROS",
        "3D Printing", "CNC Machining",
        "Aerospace Engineering", "Thermodynamics", "Fluid Mechanics",
    ],
    "Law & Social Sciences": [
        "Legal Research", "Contract Drafting", "Intellectual Property",
        "Corporate Law", "Litigation", "Compliance & Regulatory Affairs",
        "Human Rights", "Policy Analysis", "International Relations",
        "Political Science", "Sociology", "Anthropology",
        "Psychology", "Cognitive Science", "Behavioral Economics",
        "Social Work", "Community Outreach", "NGO Management",
    ],
    "Creative Arts": [
        "Creative Writing", "Journalism", "Editing & Proofreading",
        "Translation", "Linguistics",
        "Acting", "Film Production", "Screenwriting",
        "Music Production", "Audio Engineering", "Piano", "Guitar",
        "Interior Design", "Fashion Design", "Architecture",
        "Illustration", "Animation (2D)", "3D Modeling (Blender)",
    ],
    "Soft Skills": [
        "Leadership", "Communication", "Public Speaking", "Negotiation",
        "Critical Thinking", "Problem Solving", "Time Management",
        "Teamwork", "Adaptability", "Creativity",
        "Arabic", "English", "French", "German", "Spanish", "Turkish", "Chinese (Mandarin)",
    ],
}

flat_skills = [s for skills in ALL_SKILLS.values() for s in skills]

# ─────────────────────────────────────────────────────────────────────────────
# DEMO USERS
# ─────────────────────────────────────────────────────────────────────────────
STUDENTS = [
    {"email": "alex@student.com",    "full_name": "Alex Johnson",    "password": "pass1234",
     "bio": "Aspiring backend developer. Love Python and FastAPI.",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "Linux"]},

    {"email": "sara@student.com",    "full_name": "Sara Khalil",     "password": "pass1234",
     "bio": "Marketing student passionate about digital growth and branding.",
     "skills": ["Digital Marketing", "SEO", "Content Marketing", "Canva", "Google Ads", "Copywriting"]},

    {"email": "liam@student.com",    "full_name": "Liam Müller",     "password": "pass1234",
     "bio": "Mechatronics student interested in robotics and embedded systems.",
     "skills": ["Robotics", "Embedded Systems", "Arduino", "C++", "MATLAB", "CAD (SolidWorks)"]},

    {"email": "nour@student.com",    "full_name": "Nour Al-Rashid",  "password": "pass1234",
     "bio": "Pre-med student with strong research skills and lab experience.",
     "skills": ["Clinical Research", "Biochemistry", "Laboratory Techniques", "Biostatistics", "Medical Writing"]},

    {"email": "emily@student.com",   "full_name": "Emily Chen",      "password": "pass1234",
     "bio": "Full-stack developer building cool things with React and Node.js.",
     "skills": ["React", "Node.js", "TypeScript", "MongoDB", "GraphQL", "Git"]},

    {"email": "omar@student.com",    "full_name": "Omar Benali",     "password": "pass1234",
     "bio": "Finance student with a passion for investment analysis and capital markets.",
     "skills": ["Financial Analysis", "Financial Modeling", "Excel (Advanced)", "Investment Analysis", "Economics", "Valuation"]},

    {"email": "yuna@student.com",    "full_name": "Yuna Park",       "password": "pass1234",
     "bio": "UX/UI designer who loves turning complex problems into elegant interfaces.",
     "skills": ["UI/UX Design", "Figma", "Adobe XD", "Graphic Design", "Canva", "User Research"]},

    {"email": "david@student.com",   "full_name": "David Nkosi",     "password": "pass1234",
     "bio": "Data science enthusiast. Currently exploring ML and big data.",
     "skills": ["Python", "Pandas", "Machine Learning", "Scikit-learn", "Data Visualization", "SQL"]},
]

EMPLOYERS = [
    {"email": "hr@techcorp.com",     "full_name": "TechCorp HR",     "password": "pass1234"},
    {"email": "hr@mediawave.com",    "full_name": "MediaWave Talent","password": "pass1234"},
    {"email": "hr@medicore.com",     "full_name": "MediCore Health",  "password": "pass1234"},
    {"email": "hr@bridgenow.com",    "full_name": "BridgeNow Finance","password": "pass1234"},
    {"email": "hr@designhive.com",   "full_name": "DesignHive Studio","password": "pass1234"},
]

# ─────────────────────────────────────────────────────────────────────────────
# INTERNSHIPS
# ─────────────────────────────────────────────────────────────────────────────
INTERNSHIPS = [
    {
        "employer": "hr@techcorp.com",
        "title": "Backend Engineering Intern",
        "description": "Join our platform team to build scalable APIs using Python and FastAPI. You'll work on real production systems serving thousands of users.",
        "required_skills": [
            {"name": "Python", "level": 3},
            {"name": "FastAPI", "level": 2},
            {"name": "PostgreSQL", "level": 2},
            {"name": "Docker", "level": 2},
            {"name": "Git", "level": 2},
        ],
    },
    {
        "employer": "hr@techcorp.com",
        "title": "Machine Learning Intern",
        "description": "Work alongside our AI team on real-world ML pipelines, model training, and data preprocessing using Python and PyTorch.",
        "required_skills": [
            {"name": "Python", "level": 3},
            {"name": "Machine Learning", "level": 2},
            {"name": "PyTorch", "level": 2},
            {"name": "Pandas", "level": 2},
            {"name": "Data Visualization", "level": 1},
        ],
    },
    {
        "employer": "hr@techcorp.com",
        "title": "Frontend Developer Intern",
        "description": "Build beautiful, responsive web interfaces using React and TypeScript. Work closely with our design team for pixel-perfect implementations.",
        "required_skills": [
            {"name": "React", "level": 3},
            {"name": "TypeScript", "level": 2},
            {"name": "UI/UX Design", "level": 1},
            {"name": "Git", "level": 2},
        ],
    },
    {
        "employer": "hr@mediawave.com",
        "title": "Digital Marketing Intern",
        "description": "Manage social campaigns, write compelling copy, and dive deep into SEO strategy for a fast-growing media brand.",
        "required_skills": [
            {"name": "Digital Marketing", "level": 2},
            {"name": "SEO", "level": 2},
            {"name": "Content Marketing", "level": 2},
            {"name": "Copywriting", "level": 2},
            {"name": "Google Ads", "level": 1},
        ],
    },
    {
        "employer": "hr@mediawave.com",
        "title": "Video Production Intern",
        "description": "Shoot, edit, and produce video content for our social channels. Requires strong storytelling sense and hands-on editing experience.",
        "required_skills": [
            {"name": "Video Editing", "level": 3},
            {"name": "Adobe Premiere Pro", "level": 2},
            {"name": "Storytelling", "level": 2},
            {"name": "Content Creation", "level": 2},
        ],
    },
    {
        "employer": "hr@medicore.com",
        "title": "Clinical Research Intern",
        "description": "Assist our research team with data collection, literature reviews, and report writing for ongoing clinical trials.",
        "required_skills": [
            {"name": "Clinical Research", "level": 2},
            {"name": "Medical Writing", "level": 2},
            {"name": "Biostatistics", "level": 2},
            {"name": "Microsoft Excel", "level": 2},
        ],
    },
    {
        "employer": "hr@medicore.com",
        "title": "Bioinformatics Intern",
        "description": "Analyze genomic datasets, run bioinformatics pipelines, and contribute to cutting-edge research in personalized medicine.",
        "required_skills": [
            {"name": "Python", "level": 2},
            {"name": "Bioinformatics", "level": 2},
            {"name": "Genomics", "level": 1},
            {"name": "R", "level": 2},
            {"name": "Biochemistry", "level": 2},
        ],
    },
    {
        "employer": "hr@bridgenow.com",
        "title": "Financial Analysis Intern",
        "description": "Support our corporate finance team with financial modeling, DCF valuations, and investment research for portfolio companies.",
        "required_skills": [
            {"name": "Financial Analysis", "level": 2},
            {"name": "Financial Modeling", "level": 2},
            {"name": "Excel (Advanced)", "level": 3},
            {"name": "Valuation", "level": 2},
            {"name": "Economics", "level": 2},
        ],
    },
    {
        "employer": "hr@bridgenow.com",
        "title": "Business Development Intern",
        "description": "Research new markets, qualify leads, and support the BD team in building partnerships and closing B2B deals.",
        "required_skills": [
            {"name": "Business Development", "level": 1},
            {"name": "Market Research", "level": 2},
            {"name": "CRM", "level": 1},
            {"name": "Communication", "level": 3},
            {"name": "Negotiation", "level": 2},
        ],
    },
    {
        "employer": "hr@designhive.com",
        "title": "UX/UI Design Intern",
        "description": "Design wireframes, prototypes, and final UI based on user research. Collaborate with developers to deliver great experiences.",
        "required_skills": [
            {"name": "UI/UX Design", "level": 3},
            {"name": "Figma", "level": 3},
            {"name": "Adobe XD", "level": 2},
            {"name": "Graphic Design", "level": 2},
        ],
    },
    {
        "employer": "hr@designhive.com",
        "title": "Brand & Content Intern",
        "description": "Craft brand stories, social copy, and visual content. You'll shape how our clients are perceived across every touchpoint.",
        "required_skills": [
            {"name": "Graphic Design", "level": 2},
            {"name": "Canva", "level": 2},
            {"name": "Copywriting", "level": 2},
            {"name": "Adobe Photoshop", "level": 2},
            {"name": "Brand Strategy", "level": 1},
        ],
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# SEED FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def seed():
    init_db()

    # Clear all tables
    with _conn() as con:
        con.execute("DELETE FROM applications")
        con.execute("DELETE FROM internships")
        con.execute("DELETE FROM student_profiles")
        con.execute("DELETE FROM users")
        print("🗑️  Cleared existing data.")

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

    # Seed some applications with realistic statuses
    # (student, internship_index, status)
    applications = [
        ("alex@student.com",   0,  "Interviewing"),  # Alex → Backend Intern
        ("alex@student.com",   1,  "Applied"),        # Alex → ML Intern (partial match)
        ("emily@student.com",  2,  "Offered"),        # Emily → Frontend Intern
        ("emily@student.com",  0,  "Applied"),        # Emily → Backend Intern
        ("david@student.com",  1,  "Interviewing"),   # David → ML Intern
        ("sara@student.com",   3,  "Offered"),        # Sara → Digital Marketing
        ("sara@student.com",   4,  "Applied"),        # Sara → Video Production
        ("nour@student.com",   5,  "Applied"),        # Nour → Clinical Research
        ("nour@student.com",   6,  "Applied"),        # Nour → Bioinformatics
        ("omar@student.com",   7,  "Interviewing"),   # Omar → Finance
        ("omar@student.com",   8,  "Applied"),        # Omar → Biz Dev
        ("liam@student.com",   2,  "Rejected"),       # Liam → Frontend (not a match)
        ("yuna@student.com",   9,  "Offered"),        # Yuna → UX/UI
        ("yuna@student.com",   10, "Applied"),        # Yuna → Brand & Content
    ]

    for student_email, intern_idx, status in applications:
        intern_id = created_internships[intern_idx]["id"]
        apply_to_internship(intern_id, student_email)
        if status != "Applied":
            update_application_status(intern_id, student_email, status)
    print(f"✅ Created {len(applications)} applications with realistic statuses.")

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
