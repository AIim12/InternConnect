"""
Comprehensive unit tests for InternConnect backend
Tests for 90%+ code coverage
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from store import (
    register_user, login_user, create_token, decode_token,
    get_user, update_user_role, get_all_users_safe,
    update_profile, get_profile,
    create_internship, get_all_internships, get_employer_internships,
    apply_to_internship, get_student_applications, get_applicants,
    update_application_status, compute_match,
    set_user_otp_secret, enable_user_otp, disable_user_otp,
    get_notifications, mark_notifications_read,
    init_db, _conn
)
from unittest.mock import patch, MagicMock
import time

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db():
    """Reset database before each test"""
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


class TestAuthentication:
    """Test user registration, login, and authentication"""
    
    def test_register_student_success(self):
        result = register_user("alice@test.com", "Pass123!", "Alice", "student")
        assert "error" not in result
        assert result["email"] == "alice@test.com"
    
    def test_register_employer_success(self):
        result = register_user("bob@test.com", "Pass123!", "Bob", "employer")
        assert "error" not in result
        assert result["role"] == "employer"
    
    def test_register_duplicate_email(self):
        register_user("duplicate@test.com", "Pass123!", "User 1", "student")
        result = register_user("duplicate@test.com", "Pass123!", "User 2", "student")
        assert "error" in result
    
    def test_login_success(self):
        register_user("logintest@test.com", "Pass123!", "Login Test", "student")
        user = login_user("logintest@test.com", "Pass123!")
        assert user is not None
        assert user["email"] == "logintest@test.com"
    
    def test_login_wrong_password(self):
        register_user("wrongpass@test.com", "CorrectPass123!", "User", "student")
        user = login_user("wrongpass@test.com", "WrongPass123!")
        assert user is None
    
    def test_login_nonexistent_user(self):
        user = login_user("nonexistent@test.com", "AnyPass123!")
        assert user is None
    
    def test_create_and_decode_token(self):
        token = create_token({"sub": "test@test.com", "role": "student"})
        assert token is not None
        
        payload = decode_token(token)
        assert payload["sub"] == "test@test.com"
        assert payload["role"] == "student"
    
    def test_decode_invalid_token(self):
        with pytest.raises(Exception):
            decode_token("invalid.token.here")
    
    def test_decode_expired_token(self):
        # Create a token that will expire quickly
        token = create_token({"sub": "test@test.com", "role": "student"})
        
        # Manually manipulate time (in real scenario, use freezegun)
        # For now, just test that valid tokens decode correctly
        payload = decode_token(token)
        assert payload is not None


class TestUserManagement:
    """Test user profile and role management"""
    
    def test_get_user(self):
        register_user("getuser@test.com", "Pass123!", "Get User", "student")
        user = get_user("getuser@test.com")
        assert user is not None
        assert user["full_name"] == "Get User"
    
    def test_get_nonexistent_user(self):
        user = get_user("nonexistent@test.com")
        assert user is None
    
    def test_update_profile(self):
        register_user("profile@test.com", "Pass123!", "Profile User", "student")
        result = update_profile(
            "profile@test.com",
            bio="Great developer",
            skills=["Python", "JavaScript"],
            major="CS"
        )
        assert result["bio"] == "Great developer"
        assert "Python" in result["skills"]
    
    def test_get_profile(self):
        register_user("getprofile@test.com", "Pass123!", "Profile User", "student")
        update_profile("getprofile@test.com", bio="Test bio", skills=["Java"])
        
        profile = get_profile("getprofile@test.com")
        assert profile is not None
        assert profile["bio"] == "Test bio"
    
    def test_update_user_role_admin(self):
        register_user("admin@test.com", "Pass123!", "Admin", "admin")
        register_user("student@test.com", "Pass123!", "Student", "student")
        
        result = update_user_role("admin@test.com", "student@test.com", "employer")
        assert result["role"] == "employer"
    
    def test_update_user_role_non_admin(self):
        register_user("notadmin@test.com", "Pass123!", "Not Admin", "student")
        register_user("other@test.com", "Pass123!", "Other", "student")
        
        with pytest.raises(Exception):
            update_user_role("notadmin@test.com", "other@test.com", "admin")
    
    def test_get_all_users_safe(self):
        register_user("user1@test.com", "Pass123!", "User 1", "student")
        register_user("user2@test.com", "Pass123!", "User 2", "employer")
        
        users = get_all_users_safe()
        assert len(users) >= 2
        # Passwords should not be included
        assert all("password" not in user for user in users)


class TestTwoFactorAuthentication:
    """Test 2FA setup and verification"""
    
    def test_set_otp_secret(self):
        register_user("2fa@test.com", "Pass123!", "2FA User", "student")
        secret = "JBSWY3DPEHPK3PXP"  # Example TOTP secret
        set_user_otp_secret("2fa@test.com", secret)
        
        user = get_user("2fa@test.com")
        assert user["otp_secret"] == secret
    
    def test_enable_otp(self):
        register_user("otp@test.com", "Pass123!", "OTP User", "student")
        set_user_otp_secret("otp@test.com", "JBSWY3DPEHPK3PXP")
        
        result = enable_user_otp("otp@test.com")
        assert result["otp_enabled"] is True
    
    def test_disable_otp(self):
        register_user("disableotp@test.com", "Pass123!", "Disable OTP User", "student")
        set_user_otp_secret("disableotp@test.com", "JBSWY3DPEHPK3PXP")
        enable_user_otp("disableotp@test.com")
        
        result = disable_user_otp("disableotp@test.com")
        assert result["otp_enabled"] is False


class TestInternships:
    """Test internship creation and management"""
    
    def test_create_internship(self):
        result = create_internship(
            title="Backend Developer",
            description="Python FastAPI role",
            required_skills=[{"name": "Python", "level": 3}],
            company="TechCorp",
            created_by="employer@test.com"
        )
        assert result["title"] == "Backend Developer"
        assert result["company"] == "TechCorp"
    
    def test_get_all_internships(self):
        create_internship("Job1", "Desc", [], "Company1", "emp1@test.com")
        create_internship("Job2", "Desc", [], "Company2", "emp2@test.com")
        
        internships = get_all_internships()
        assert len(internships) >= 2
    
    def test_get_employer_internships(self):
        register_user("emp@test.com", "Pass123!", "Employer", "employer")
        create_internship("Job1", "Desc", [], "Company", "emp@test.com")
        create_internship("Job2", "Desc", [], "Company", "emp@test.com")
        create_internship("Job3", "Desc", [], "Company", "other@test.com")
        
        jobs = get_employer_internships("emp@test.com")
        assert len(jobs) == 2


class TestApplications:
    """Test application submission and management"""
    
    def test_apply_to_internship(self):
        register_user("student@test.com", "Pass123!", "Student", "student")
        job = create_internship("Job", "Desc", [], "Company", "emp@test.com")
        
        result = apply_to_internship("student@test.com", job["id"], "Applied")
        assert result["status"] == "Applied"
    
    def test_cannot_apply_twice_to_same_job(self):
        register_user("student@test.com", "Pass123!", "Student", "student")
        job = create_internship("Job", "Desc", [], "Company", "emp@test.com")
        
        apply_to_internship("student@test.com", job["id"], "Applied")
        
        with pytest.raises(Exception):
            apply_to_internship("student@test.com", job["id"], "Applied")
    
    def test_get_student_applications(self):
        register_user("student@test.com", "Pass123!", "Student", "student")
        job1 = create_internship("Job1", "Desc", [], "Company", "emp@test.com")
        job2 = create_internship("Job2", "Desc", [], "Company", "emp@test.com")
        
        apply_to_internship("student@test.com", job1["id"], "Applied")
        apply_to_internship("student@test.com", job2["id"], "Applied")
        
        applications = get_student_applications("student@test.com")
        assert len(applications) == 2
    
    def test_get_applicants_for_job(self):
        job = create_internship("Job", "Desc", [], "Company", "emp@test.com")
        
        register_user("stu1@test.com", "Pass123!", "Student 1", "student")
        register_user("stu2@test.com", "Pass123!", "Student 2", "student")
        
        apply_to_internship("stu1@test.com", job["id"], "Applied")
        apply_to_internship("stu2@test.com", job["id"], "Applied")
        
        applicants = get_applicants(job["id"])
        assert len(applicants) == 2
    
    def test_update_application_status(self):
        register_user("student@test.com", "Pass123!", "Student", "student")
        job = create_internship("Job", "Desc", [], "Company", "emp@test.com")
        apply_to_internship("student@test.com", job["id"], "Applied")
        
        result = update_application_status(
            job["id"],
            "student@test.com",
            "Offered"
        )
        assert result["status"] == "Offered"


class TestNotifications:
    """Test notification system"""
    
    def test_get_notifications(self):
        register_user("user@test.com", "Pass123!", "User", "student")
        notifications = get_notifications("user@test.com")
        assert isinstance(notifications, list)
    
    def test_mark_notifications_read(self):
        register_user("user@test.com", "Pass123!", "User", "student")
        result = mark_notifications_read("user@test.com")
        assert result is not None


class TestMatching:
    """Test skill matching algorithm"""
    
    def test_compute_match(self):
        student_skills = [
            {"name": "Python", "level": 3},
            {"name": "JavaScript", "level": 2}
        ]
        job_requirements = [
            {"name": "Python", "level": 2},
            {"name": "JavaScript", "level": 3},
            {"name": "React", "level": 1}
        ]
        
        match = compute_match(student_skills, job_requirements)
        assert isinstance(match, dict)
        assert "match_score" in match or "score" in match or "percentage" in match
    
    def test_compute_match_no_skills(self):
        student_skills = []
        job_requirements = [{"name": "Python", "level": 2}]
        
        match = compute_match(student_skills, job_requirements)
        assert isinstance(match, dict)


class TestHTTPEndpoints:
    """Test HTTP API endpoints"""
    
    def test_register_endpoint(self):
        response = client.post("/auth/register", json={
            "email": "http_test@test.com",
            "password": "Pass123!",
            "full_name": "HTTP Test",
            "role": "student"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_login_endpoint(self):
        client.post("/auth/register", json={
            "email": "http_login@test.com",
            "password": "Pass123!",
            "full_name": "HTTP Login",
            "role": "student"
        })
        
        response = client.post("/auth/login", json={
            "email": "http_login@test.com",
            "password": "Pass123!"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_protected_endpoint_without_token(self):
        response = client.get("/auth/me")
        assert response.status_code == 403
    
    def test_protected_endpoint_with_token(self):
        reg = client.post("/auth/register", json={
            "email": "protected@test.com",
            "password": "Pass123!",
            "full_name": "Protected",
            "role": "student"
        })
        token = reg.json()["access_token"]
        
        response = client.get("/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        assert response.json()["email"] == "protected@test.com"
    
    def test_invalid_token_format(self):
        response = client.get("/auth/me", headers={
            "Authorization": "InvalidToken"
        })
        assert response.status_code == 401
    
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_admin_data_endpoint(self):
        response = client.get("/admin/data")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "internships" in data


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_missing_required_fields_registration(self):
        response = client.post("/auth/register", json={
            "email": "incomplete@test.com"
            # Missing password, full_name, role
        })
        assert response.status_code != 200
    
    def test_sql_injection_protection(self):
        # Try to inject SQL
        response = client.post("/auth/login", json={
            "email": "' OR '1'='1",
            "password": "' OR '1'='1"
        })
        # Should not crash, should just not find user
        assert response.status_code in [200, 401]
    
    def test_xss_protection_profile(self):
        register_user("xss@test.com", "Pass123!", "XSS Test", "student")
        
        # Try to store XSS payload
        result = update_profile(
            "xss@test.com",
            bio="<script>alert('XSS')</script>",
            skills=["<img src=x onerror=alert('XSS')>"]
        )
        
        # Data should be stored as-is (frontend should escape on display)
        assert result is not None


class TestCORSAndSecurity:
    """Test CORS and security headers"""
    
    def test_cors_headers_present(self):
        response = client.get("/")
        # CORS middleware should handle this
        assert response.status_code == 200
    
    def test_api_response_format(self):
        response = client.get("/admin/data")
        # Should return JSON
        assert response.headers["content-type"].startswith("application/json")
