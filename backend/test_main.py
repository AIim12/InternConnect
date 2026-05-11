from fastapi.testclient import TestClient
from main import app
from store import init_db, _conn
from seed import seed
import pytest
from unittest.mock import patch, MagicMock

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    con = _conn()
    con.executescript("""
    DROP TABLE IF EXISTS applications;
    DROP TABLE IF EXISTS internships;
    DROP TABLE IF EXISTS student_profiles;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS users;
    """)
    con.close()
    init_db()
    yield

@pytest.fixture(autouse=True)
def mock_falkordb_driver():
    with patch("backend.database.FalkorDB") as mock_falkordb_class:
        mock_client = MagicMock()
        mock_graph = MagicMock()
        mock_graph.query.return_value.result_set = []
        mock_client.select_graph.return_value = mock_graph
        mock_falkordb_class.return_value = mock_client
        
        from database import GraphDatabase
        GraphDatabase._instance = None
        yield

def test_seed_execution():
    # Run the seed script to cover seed.py and heavily test store.py functions
    seed()

def test_full_auth_flow():
    # 1. Test User Registration
    resp = client.post("/auth/register", json={
        "email": "test@student.com",
        "password": "SecurePass123",
        "full_name": "Test Student",
        "role": "student"
    })
    assert resp.status_code == 200
    
    # 2. Test User Login
    resp = client.post("/auth/login", json={
        "email": "test@student.com",
        "password": "SecurePass123"
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    # 3. Test Protected Route Access (Get Profile)
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@student.com"

def test_social_login_flow():
    resp = client.post("/auth/social-login", json={
        "provider": "GitHub",
        "email": "github@student.com",
        "full_name": "GitHub User",
        "role": "student"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_admin_dashboard():
    client.post("/auth/register", json={"email": "admin@test.com", "password": "pass", "full_name": "Admin", "role": "admin"})
    token = client.post("/auth/login", json={"email": "admin@test.com", "password": "pass"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/auth/admin/users", headers=headers)
    assert res.status_code == 200
    
    res = client.patch("/auth/admin/users/admin@test.com/role", json={"new_role": "employer"}, headers=headers)
    assert res.status_code == 400

    client.post("/auth/register", json={"email": "stu@test.com", "password": "pass", "full_name": "Stu", "role": "student"})
    res = client.patch("/auth/admin/users/stu@test.com/role", json={"new_role": "employer"}, headers=headers)
    assert res.status_code == 200

def test_profile_and_2fa():
    client.post("/auth/register", json={"email": "stu2@test.com", "password": "pass", "full_name": "Stu2", "role": "student"})
    token = client.post("/auth/login", json={"email": "stu2@test.com", "password": "pass"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.put("/auth/profile", json={"bio": "Hello", "skills": ["Python"], "major": "CS"}, headers=headers)
    assert res.status_code == 200
    res = client.get("/auth/profile", headers=headers)
    assert "Python" in res.json()["skills"]

    res = client.get("/auth/2fa/setup", headers=headers)
    assert res.status_code == 200
    
    res = client.post("/auth/2fa/disable", headers=headers)
    assert res.status_code == 200

def test_internships_and_applications():
    client.post("/auth/register", json={"email": "emp@test.com", "password": "pass", "full_name": "Emp", "role": "employer"})
    emp_token = client.post("/auth/login", json={"email": "emp@test.com", "password": "pass"}).json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    res = client.post("/auth/internships", json={
        "title": "Dev", "description": "Desc", "required_skills": [{"name": "Python", "level": 1}]
    }, headers=emp_headers)
    assert res.status_code == 200
    job_id = res.json()["id"]

    res = client.get("/auth/internships")
    assert len(res.json()) > 0
    res = client.get("/auth/internships/my", headers=emp_headers)
    assert len(res.json()) > 0

    client.post("/auth/register", json={"email": "stu3@test.com", "password": "pass", "full_name": "Stu", "role": "student"})
    stu_token = client.post("/auth/login", json={"email": "stu3@test.com", "password": "pass"}).json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}
    
    res = client.post(f"/auth/internships/{job_id}/apply", headers=stu_headers)
    assert res.status_code == 200

    res = client.get("/auth/applications/me", headers=stu_headers)
    assert len(res.json()) > 0

    res = client.get(f"/auth/internships/{job_id}/applicants", headers=emp_headers)
    assert len(res.json()) > 0

    res = client.patch(f"/auth/internships/{job_id}/applicants/stu3@test.com?status=Offered", headers=emp_headers)
    assert res.status_code == 200
    
    res = client.get("/auth/notifications", headers=stu_headers)
    assert len(res.json()) > 0
    res = client.post("/auth/notifications/read", headers=stu_headers)
    assert res.status_code == 200

def test_graph_endpoints():
    res = client.get("/graph/export")
    assert res.status_code == 200
    res = client.get("/match/gap/testuser/TestJob")
    assert res.status_code == 200
    res = client.get("/match/students/TestJob")
    assert res.status_code == 200
    res = client.post("/skills/", json={"name": "Java", "domain": "Backend"})
    assert res.status_code == 200
    res = client.post("/skills/Java/related/C++")
    assert res.status_code == 200
    res = client.post("/skills/student/testuser?skill_name=Java&level=2")
    assert res.status_code == 200
    res = client.post("/internships/", json={"title": "TestJob", "description": "desc"})
    assert res.status_code == 200
    res = client.post("/internships/TestJob/requirements?skill_name=Java&level_required=2")
    assert res.status_code == 200
    res = client.post("/internships/TestJob/apply/testuser")
    assert res.status_code == 200

def test_graph_offline_coverage():
    # Test FalkorDB failure fallback
    from database import GraphDatabase
    GraphDatabase._instance = None
    with patch("database.FalkorDB", side_effect=Exception("DB Offline")):
        res = client.get("/graph/export")
        assert res.status_code == 200
        assert len(res.json()["nodes"]) > 0

def test_internship_edge_cases():
    client.post("/auth/register", json={"email": "edge_emp@test.com", "password": "pass", "full_name": "Emp", "role": "employer"})
    emp_tok = client.post("/auth/login", json={"email": "edge_emp@test.com", "password": "pass"}).json()["access_token"]
    emp_head = {"Authorization": f"Bearer {emp_tok}"}
    
    client.post("/auth/register", json={"email": "edge_stu@test.com", "password": "pass", "full_name": "Stu", "role": "student"})
    stu_tok = client.post("/auth/login", json={"email": "edge_stu@test.com", "password": "pass"}).json()["access_token"]
    stu_head = {"Authorization": f"Bearer {stu_tok}"}
    
    res = client.post("/auth/internships", json={
        "title": "EdgeJob", "description": "Desc", "required_skills": []
    }, headers=emp_head)
    job_id = res.json()["id"]
    
    client.post(f"/auth/internships/{job_id}/apply", headers=stu_head)
    res2 = client.post(f"/auth/internships/{job_id}/apply", headers=stu_head)
    assert res2.status_code == 400

    res3 = client.patch(f"/auth/internships/{job_id}/applicants/edge_stu@test.com?status=Rejected", headers=emp_head)
    assert res3.status_code == 200

    res4 = client.patch(f"/auth/internships/{job_id}/applicants/unknown@test.com?status=Rejected", headers=emp_head)
    assert res4.status_code == 404
    
    res5 = client.get(f"/auth/internships/{job_id}/match", headers=stu_head)
    assert res5.status_code == 200
    
    res6 = client.get("/auth/internships/9999/match", headers=stu_head)
    assert res6.status_code == 404

def test_admin_data():
    res = client.get("/admin/data")
    assert res.status_code == 200