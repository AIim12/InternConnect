# InternConnect

InternConnect is a robust, graph-powered web application connecting students with prospective employers through intelligent skill-matching algorithms.

## Features & Architecture

### Authentication & Authorization
- **Basic Auth + 2FA**: Secure user registration and login flows protected by mandatory TOTP (Two-Factor Authentication) using Authenticator apps.
- **Social Login**: Integrated options for Google, GitHub, LinkedIn, and Microsoft.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `student`, `employer`, and `admin` roles.
  - *Students* can update profiles, view jobs, and apply.
  - *Employers* can post internships, review applicants, and issue e-signature offers.
  - *Admins* have access to a dedicated dashboard to dynamically assign and revoke user roles.

### Security & Deployment
- The application is designed to be deployed on a **Self-Managed VPS** (DigitalOcean/AWS) rather than a PaaS (Vercel/Railway).
- Network security is strictly managed via UFW (Uncomplicated Firewall) and Fail2Ban.
- For complete security documentation, please see `deployment_and_security.md`.

## Screenshots

We have included critical screenshots of the running web application in the `screenshots/` directory:

1. **Dashboard Interface** - `screenshots/dashboard.png` *(Add your screenshot here)*
2. **2FA Setup & Login Flow** - `screenshots/2fa_flow.png` *(Add your screenshot here)*
3. **Admin Role Management** - `screenshots/admin_panel.png` *(Add your screenshot here)*
4. **Server Security (UFW/Fail2Ban)** - `screenshots/security.png` *(Add your screenshot here)*

## Testing & CI/CD
- Comprehensive **Unit Tests** are written using `pytest` for the FastAPI backend (`backend/test_main.py`).
- **End-to-End Tests** are configured via Playwright.
- **Automated Testing** is set up using GitHub Actions (`.github/workflows/test.yml`), which automatically runs all test suites on every push to the repository.

## Local Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```