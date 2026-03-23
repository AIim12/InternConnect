# InternConnect Database Structure Plan

## Overview
This document provides the optimal database schema design for InternConnect, a graph-based internship matching platform.

---

## 1. Current Schema Analysis

### Tables Currently Implemented:
- `users` - User authentication and basic info
- `student_profiles` - Student extended data with skills
- `employer_profiles` - Employer company information
- `internships` - Job postings with requirements
- `applications` - Application records with status
- `skill_relationships` - Graph connections between skills

### Issues with Current Design:
1. **Missing indexing** - No indexes on frequently queried columns
2. **JSON data storage** - Skills stored as JSON, harder to query/filter
3. **No profile pictures** - LONGBLOB field added but not fully utilized
4. **Missing timestamps** - Limited audit trail
5. **No messaging system** - Message field added to applications but incomplete
6. **No soft deletes** - Deleted records are permanently removed

---

## 2. Optimized Database Schema

### Core Tables (Refined)

#### 2.1 `users`
```sql
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'employer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    
    INDEX idx_role (role),
    INDEX idx_created_at (created_at),
    INDEX idx_is_active (is_active)
);
```

**Why These Changes:**
- Added `created_at` and `updated_at` for audit trails
- Added `is_active` for soft deletes (don't fully delete users)
- Added `last_login` to track user activity
- Indexes on frequently filtered columns

---

#### 2.2 `student_profiles` (Enhanced)
```sql
CREATE TABLE student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT,
    profile_picture LONGBLOB,
    profile_pic_type VARCHAR(50),
    profile_pic_url VARCHAR(500),
    bio_updated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_updated_at (updated_at)
);
```

**Why:**
- Separate `id` primary key for easier joins
- Store picture URL for CDN/cloud storage link
- Track profile update timing
- Maintains bio changes

---

#### 2.3 `student_skills` (NEW - Normalized Skills)
```sql
CREATE TABLE student_skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_email VARCHAR(255) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_type ENUM('technical', 'soft', 'language', 'other') DEFAULT 'technical',
    proficiency_level INT DEFAULT 1,  -- 1-5 scale
    years_experience DECIMAL(3,1) DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_student_skill (student_email, skill_name),
    FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_student_email (student_email),
    INDEX idx_skill_name (skill_name),
    INDEX idx_skill_type (skill_type)
);
```

**Why This is Better:**
- ❌ Instead of: JSON column `skills` (hard to query)
- ✅ Now: Separate table for filtering, sorting, and analytics
- Can efficiently query: "Give me all students with Python"
- Can track skill proficiency levels
- Can calculate average years of experience for roles

---

#### 2.4 `employer_profiles` (Enhanced)
```sql
CREATE TABLE employer_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    company_bio TEXT,
    company_logo LONGBLOB,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size ENUM('startup', 'small', 'medium', 'large') DEFAULT 'startup',
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_industry (industry),
    INDEX idx_location (location),
    INDEX idx_company_size (company_size)
);
```

**Additions:**
- Website and industry for better matching
- Company size and location for filtering
- Company logo support

---

#### 2.5 `internships` (Enhanced)
```sql
CREATE TABLE internships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    employer_email VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10, 2),
    min_hourly_rate DECIMAL(10, 2),
    max_hourly_rate DECIMAL(10, 2),
    working_hours VARCHAR(100),  -- "40/week", "20-30/week", etc
    remote BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    status ENUM('draft', 'published', 'closed', 'filled') DEFAULT 'published',
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    
    FOREIGN KEY (employer_email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_employer_email (employer_email),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    INDEX idx_remote (remote),
    INDEX idx_hourly_rate (hourly_rate),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX ft_title_desc (title, description)
);
```

**Improvements:**
- Range pricing (min/max) for flexibility
- Status tracking (draft → published → filled)
- View/application counters for analytics
- FULLTEXT index for efficient keyword search
- Published and closed timestamps

---

#### 2.6 `internship_skills` (NEW - Normalized)
```sql
CREATE TABLE internship_skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    internship_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level_required INT DEFAULT 1,  -- 1-5
    is_required BOOLEAN DEFAULT TRUE,
    nice_to_have BOOLEAN DEFAULT FALSE,
    
    UNIQUE KEY unique_internship_skill (internship_id, skill_name),
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    INDEX idx_internship_id (internship_id),
    INDEX idx_skill_name (skill_name)
);
```

**Benefits:**
- Query: "Find all students with Python for this job"
- Query: "Show me internships requiring React"
- Better matching algorithm capabilities

---

#### 2.7 `applications` (Enhanced)
```sql
CREATE TABLE applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    internship_id INT NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    status ENUM('applied', 'reviewing', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn') DEFAULT 'applied',
    match_score INT,  -- 0-100
    message TEXT,  -- Message from employer
    student_response TEXT,  -- Student's response to offer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    offered_at TIMESTAMP NULL,
    accepted_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    
    UNIQUE KEY unique_application (internship_id, student_email),
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_internship_id (internship_id),
    INDEX idx_student_email (student_email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_match_score (match_score)
);
```

**Enhancements:**
- Multiple status options for workflow
- `match_score` - store computed matching percentage
- Multiple timestamp columns for analytics
- Track student response to offers

---

#### 2.8 `skill_relationships` (Enhanced)
```sql
CREATE TABLE skill_relationships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    skill_from VARCHAR(255) NOT NULL,
    skill_to VARCHAR(255) NOT NULL,
    relationship_type ENUM('related', 'prerequisite', 'similar', 'superset') DEFAULT 'related',
    strength INT DEFAULT 5,  -- 1-10 strength of relationship
    
    UNIQUE KEY unique_relationship (skill_from, skill_to),
    FOREIGN KEY (skill_from) REFERENCES skills(name) ON DELETE CASCADE,
    FOREIGN KEY (skill_to) REFERENCES skills(name) ON DELETE CASCADE,
    INDEX idx_skill_from (skill_from),
    INDEX idx_skill_to (skill_to),
    INDEX idx_relationship_type (relationship_type)
);
```

**New:**
- Relationship types for smarter matching
- Strength metric for graph algorithms

---

#### 2.9 `skills` (NEW - Master List)
```sql
CREATE TABLE skills (
    name VARCHAR(255) PRIMARY KEY,
    category VARCHAR(100),  -- 'programming', 'framework', 'soft-skill', 'language'
    description TEXT,
    popularity INT DEFAULT 0,  -- Times requested in jobs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category)
);
```

**Purpose:**
- Single source of truth for all skills
- Track popular skills for recommendations
- Categorize skills for better organization

---

#### 2.10 `messages` (NEW - Messaging System)
```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    receiver_email VARCHAR(255) NOT NULL,
    message_type ENUM('offer', 'response', 'question', 'update') DEFAULT 'message',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (receiver_email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_receiver_email (receiver_email),
    INDEX idx_is_read (is_read)
);
```

---

#### 2.11 `saved_jobs` (NEW - Favorites)
```sql
CREATE TABLE saved_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_email VARCHAR(255) NOT NULL,
    internship_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_save (student_email, internship_id),
    FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    INDEX idx_student_email (student_email)
);
```

---

#### 2.12 `notifications` (NEW)
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_email VARCHAR(255) NOT NULL,
    type ENUM('application_status', 'offer', 'message', 'match', 'system') DEFAULT 'system',
    title VARCHAR(255),
    content TEXT,
    related_id INT,  -- application_id, message_id, etc
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
    INDEX idx_user_email (user_email),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);
```

---

## 3. Migration Strategy

### Phase 1: Add New Tables (Non-Breaking)
```sql
-- Create skills master table
-- Create student_skills (normalized)
-- Create internship_skills (normalized)
-- Create messages
-- Create saved_jobs
-- Create notifications
```

### Phase 2: Data Migration
```sql
-- Migrate skills from JSON to student_skills table
-- Migrate required_skills from JSON to internship_skills table
-- Backfill match_score in applications
```

### Phase 3: Index Optimization
- Add indexes on all foreign keys
- Add indexes on frequently filtered columns
- Add FULLTEXT indexes for search

---

## 4. Query Examples (Optimized)

### Example 1: Find Students for a Job
```sql
SELECT DISTINCT s.email, u.full_name, s.bio,
       COUNT(CASE WHEN ss.skill_name IN (
           SELECT skill_name FROM internship_skills 
           WHERE internship_id = ? AND is_required = TRUE
       ) THEN 1 END) as matched_required_skills,
       COUNT(ss.skill_name) as total_student_skills
FROM student_profiles s
JOIN users u ON u.email = s.email
LEFT JOIN student_skills ss ON ss.student_email = s.email
WHERE u.role = 'student' AND u.is_active = TRUE
GROUP BY s.email
HAVING matched_required_skills > 0
ORDER BY matched_required_skills DESC
LIMIT 50;
```

### Example 2: Search Jobs by Keyword + Filters
```sql
SELECT i.* FROM internships i
WHERE MATCH(i.title, i.description) AGAINST(? IN BOOLEAN MODE)
  AND i.is_active = TRUE
  AND i.status = 'published'
  AND i.hourly_rate BETWEEN ? AND ?
  AND EXISTS (
      SELECT 1 FROM internship_skills 
      WHERE internship_id = i.id 
      AND skill_name IN (?, ?, ?)
  )
ORDER BY i.applications_count DESC
LIMIT 20;
```

### Example 3: Calculate Match Score
```sql
SELECT 
    COUNT(CASE WHEN is_required = TRUE THEN 1 END) as required_count,
    SUM(CASE WHEN ss.skill_name IS NOT NULL THEN 1 ELSE 0 END) as matched_count,
    ROUND(
        SUM(CASE WHEN ss.skill_name IS NOT NULL THEN 1 ELSE 0 END) * 100 / 
        COUNT(CASE WHEN is_required = TRUE THEN 1 END)
    ) as match_percentage
FROM internship_skills isq
LEFT JOIN student_skills ss ON ss.skill_name = isq.skill_name 
    AND ss.student_email = ?
WHERE isq.internship_id = ?;
```

---

## 5. Performance Recommendations

### Indexing Strategy
```sql
-- Critical indexes for matching algorithm
CREATE INDEX idx_student_skills_email_skill ON student_skills(student_email, skill_name);
CREATE INDEX idx_internship_skills_job_skill ON internship_skills(internship_id, skill_name);

-- For rapid filtering
CREATE INDEX idx_apps_status_created ON applications(status, created_at);
CREATE INDEX idx_internships_filters ON internships(status, is_active, hourly_rate, remote);
```

### Query Optimization Tips
1. **Use normalized tables** instead of JSON parsing
2. **Pre-calculate match scores** during application creation
3. **Cache popular internships** on Redis
4. **Denormalize views_count** to avoid COUNT(*) queries
5. **Archive old applications** after 6 months

---

## 6. Scaling Considerations

### For 100K+ Users:
- **Partitioning**: Partition `applications` by created_at (monthly)
- **Sharding**: Shard by student_email for large deployments
- **Read Replicas**: For high-traffic internship search queries
- **Caching Layer**: Redis for frequently accessed job listings

---

## 7. Implementation Checklist

- [ ] Backup current database
- [ ] Create migration scripts
- [ ] Add new tables
- [ ] Migrate existing data
- [ ] Validate data integrity
- [ ] Add indexes
- [ ] Update API queries
- [ ] Performance test
- [ ] Deploy to production
- [ ] Monitor performance

---

## Summary

This optimized schema:
✅ Eliminates JSON parsing overhead
✅ Enables efficient filtering and searching
✅ Tracks full audit trail
✅ Scales to millions of records
✅ Supports advanced matching algorithms
✅ Maintains referential integrity
✅ Provides rich analytics capabilities
