# InternConnect (Internship Management System)

## Project Overview

InternConnect is a comprehensive internship management platform designed to bridge the gap between students, universities, and companies. The system streamlines the entire internship placement process—from application to final reporting—reducing the administrative burden on all stakeholders.

The project demonstrates:

- Full-stack web development with specialized databases.
- Automated placement workflows for academic environments.
- Multi-role access control (Students, Companies, Coordinators).
- Integration of relational and graph data models.

## Key Features

- **Centralized Placement Hub:** A unified platform for students to find and apply for internship opportunities.
- **Stakeholder Portals:** Dedicated interfaces for students, company supervisors, and university coordinators to interact.
- **Profile Management:** Allows students to showcase their skills, academic background, and portfolios.
- **Application Tracking:** Real-time monitoring of application statuses for both students and administrators.
- **Process Automation:** Automates the traditionally manual tasks of coordinating between academic departments and external organizations.
- **Reporting & Documentation:** Tools for generating internship reports and verifying completion requirements.

## Tech Stack

- **Backend:** Python: FastAPI
- **Databases:**
  - MySQL: Relational data (user profiles, applications).
  - FalkorDB: Graph data (skill-to-job matching, networking).
- **Frontend:** React.js: Vite
- **Styling:** Tailwind CSS / Material UI

## Project Structure

```plaintext
InternConnect/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── database.py      # MySQL & FalkorDB connections
│   │   └── models/          # Data schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI elements
  │   └── App.jsx          # Main application logic 
  └── package.json 
└── README.md 
```

## Prerequisites & Installation ⚠️
**Critical Requirement:** MySQL & FalkorDB This application requires both a relational and a graph database to function.

### Database Setup (OS Specific)
**macOS**
- MySQL: Install via Homebrew: `brew install mysql` and start with `brew services start mysql`.
- FalkorDB: Run via Docker: `docker run -p 6379:6379 -it --rm falkordb/falkordb`.

**Windows**
- MySQL: Download the MySQL Installer from the official site and ensure the service is running.
- FalkorDB: Install Docker Desktop and run: `docker run -p 6379:6379 -it --rm falkordb/falkordb`.

### Backend Setup
**macOS**
bash cd backend 
bash python3 -m venv venv 
bash source venv/bin/activate 
bash pip3 install -r requirements.txt 
bash uvicorn app.main:app --reload 
done Windows:
bash cd backend 
bash python -m venv venv 
bash venv\Scripts\activate 
bash pip install -r requirements.txt 
bash python -m uvicorn app.main:app --reload 
done

### Frontend Setup
**macOS**
bash cd frontend 
bash npm install 
bash npm run dev 
done Windows:
bash cd frontend 
bash npm install 
bash npm run dev 
done
### How the System Works
Hybrid Data Storage: Student profiles and metadata are stored in MySQL, while complex relationships (e.g., matching student skills to company needs) are queried via FalkorDB.
RESTful Integration: The React frontend communicates with FastAPI endpoints to fetch and update placement statuses.
Real-time Updates: Status changes are reflected instantly across all three stakeholder portals.
## Academic Requirement Coverage
This project satisfies the criteria for **SWE 4504** (Design Project - I):
1. System Architecture: Clear separation between frontend presentation and backend logic.
2. Advanced Databases: Dual-database implementation using MySQL and FalkorDB.
3. User Experience: Focuses on accessibility and intuitive navigation for non-technical users.
4. Problem Solving: Addresses the specific problem of inefficient internship placement workflows.