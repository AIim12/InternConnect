# API Testing Guide - Postman/cURL Examples

## Authentication

### Register as Student
```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "student"
  }'
```

### Register as Employer
```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employer@example.com",
    "password": "password123",
    "full_name": "Company Admin",
    "role": "employer"
  }'
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "student"
}
```

---

## Student Profile Operations

### Update Student Profile (with custom skills)
```bash
curl -X PUT http://127.0.0.1:8000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Passionate about web development and AI. Looking for internship.",
    "skills": [
      "Python",
      "React",
      "TypeScript",
      "Leadership",
      "Problem Solving"
    ]
  }'
```

### Get Student Profile
```bash
curl -X GET http://127.0.0.1:8000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Employer Profile Operations

### Update Employer Profile
```bash
curl -X PUT http://127.0.0.1:8000/auth/employer/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechCorp Inc",
    "company_bio": "Leading AI and ML solutions company. We build the future."
  }'
```

### Get Employer Profile
```bash
curl -X GET http://127.0.0.1:8000/auth/employer/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Internship Operations

### Create Internship (with new fields)
```bash
curl -X POST http://127.0.0.1:8000/auth/internships \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Backend Developer Internship",
    "description": "Build scalable APIs using FastAPI and PostgreSQL.",
    "required_skills": [
      {"name": "Python", "level": 3},
      {"name": "SQL", "level": 2},
      {"name": "Docker", "level": 2}
    ],
    "hourly_rate": 18.50,
    "working_hours": "40 hours/week",
    "remote": true
  }'
```

### Update Internship
```bash
curl -X PATCH http://127.0.0.1:8000/auth/internships/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hourly_rate": 20.00,
    "working_hours": "30 hours/week",
    "remote": true
  }'
```

### Delete Internship
```bash
curl -X DELETE http://127.0.0.1:8000/auth/internships/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get All Internships (with filtering)
```bash
curl -X GET "http://127.0.0.1:8000/auth/internships" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get My Internships (as employer)
```bash
curl -X GET http://127.0.0.1:8000/auth/internships/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Application Operations

### Apply to Internship
```bash
curl -X POST http://127.0.0.1:8000/auth/internships/1/apply \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get My Applications (student)
```bash
curl -X GET http://127.0.0.1:8000/auth/applications/me \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

Response includes match percentage:
```json
[
  {
    "id": 5,
    "internship_id": 1,
    "title": "Backend Developer Internship",
    "status": "Applied",
    "match_percentage": 85,
    "matched_skills": ["Python", "SQL"],
    "missing": ["Docker"]
  }
]
```

### Get Applicants for Job (employer)
```bash
curl -X GET http://127.0.0.1:8000/auth/internships/1/applicants \
  -H "Authorization: Bearer EMPLOYER_TOKEN"
```

Response:
```json
[
  {
    "email": "student@example.com",
    "full_name": "John Doe",
    "bio": "Passionate developer",
    "skills": ["Python", "React"],
    "status": "Applied"
  }
]
```

### Send Offer & Update Application Status
```bash
curl -X PATCH http://127.0.0.1:8000/auth/internships/1/applicants/student@example.com \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Offered",
    "message": "Congratulations! We'd like to offer you the position of Backend Developer Internship. We're excited to have you on our team! This is a 40 hour/week remote position at $18.50/hr."
  }'
```

### Update Application Status (Reject)
```bash
curl -X PATCH http://127.0.0.1:8000/auth/internships/1/applicants/student@example.com \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Rejected"
  }'
```

---

## Testing Scenarios

### Scenario 1: Complete Workflow

#### Step 1: Employer registers and creates job
```bash
# Register as employer
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@techcorp.com",
    "password": "pass123",
    "full_name": "HR Manager",
    "role": "employer"
  }'

# Save token from response as EMPLOYER_TOKEN

# Update company profile
curl -X PUT http://127.0.0.1:8000/auth/employer/profile \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechCorp",
    "company_bio": "AI company"
  }'

# Post internship
curl -X POST http://127.0.0.1:8000/auth/internships \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ML Engineer",
    "description": "Work on AI models",
    "required_skills": [{"name": "Python", "level": 4}],
    "hourly_rate": 25,
    "working_hours": "40/week",
    "remote": true
  }'

# Save internship_id from response
```

#### Step 2: Student registers and applies
```bash
# Register as student
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@gmail.com",
    "password": "pass123",
    "full_name": "Alice Smith",
    "role": "student"
  }'

# Save token as STUDENT_TOKEN

# Update profile with Python skill
curl -X PUT http://127.0.0.1:8000/auth/profile \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "ML enthusiast",
    "skills": ["Python", "TensorFlow"]
  }'

# Apply to job
curl -X POST http://127.0.0.1:8000/auth/internships/1/apply \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Step 3: Employer reviews and sends offer
```bash
# View applicants
curl -X GET http://127.0.0.1:8000/auth/internships/1/applicants \
  -H "Authorization: Bearer EMPLOYER_TOKEN"

# Send offer
curl -X PATCH http://127.0.0.1:8000/auth/internships/1/applicants/alice@gmail.com \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Offered",
    "message": "Congratulations Alice! We offer you the ML Engineer Internship position at $25/hr."
  }'
```

#### Step 4: Student checks applications
```bash
curl -X GET http://127.0.0.1:8000/auth/applications/me \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Should see the offer with message and 100% match
```

---

## Testing with Postman

1. Create collection "InternConnect"
2. Set variable `base_url` = `http://127.0.0.1:8000`
3. Set variable `token` = (save from auth responses)
4. Add all requests above with `{{base_url}}` and `Authorization: Bearer {{token}}`

---

## Expected Status Codes

| Endpoint | Success | Error |
|----------|---------|-------|
| POST /register | 200 | 409 (email exists) |
| POST /login | 200 | 401 (wrong password) |
| PUT /profile | 200 | 401 (no token) |
| POST /internships | 200 | 403 (not employer) |
| POST /apply | 200 | 400 (already applied) |
| PATCH /applicants/{email} | 200 | 404 (not found) |

---

## Troubleshooting

**Token Expired?**
```
Error: "Token invalid or expired"
Solution: Re-login and get new token
```

**Permission Denied?**
```
Error: "Only employers can post internships"
Solution: Use employer token, not student token
```

**Field Not Found?**
```
Error: Extra fields in JSON
Solution: Use exact field names from schema
```

---

Created: March 22, 2026
Version: 1.0
