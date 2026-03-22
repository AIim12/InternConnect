from backend.database import get_db

class MatchRepository:
    def __init__(self):
        self.db = get_db()

    def create_skill(self, name: str, domain: str = ""):
        query = "MERGE (s:Skill {name: $name}) SET s.domain = $domain RETURN s"
        self.db.query(query, {'name': name, 'domain': domain})
        return {"name": name, "domain": domain}

    def create_student(self, username: str):
        query = "MERGE (s:Student {username: $username}) RETURN s"
        self.db.query(query, {'username': username})
        return {"username": username}

    def create_internship(self, title: str):
        query = "MERGE (i:Internship {title: $title}) RETURN i"
        self.db.query(query, {'title': title})
        return {"title": title}

    def add_student_skill(self, username: str, skill_name: str, level: int):
        query = """
        MATCH (u:Student {username: $username}), (s:Skill {name: $skill_name})
        MERGE (u)-[r:HAS_SKILL]->(s)
        SET r.level = $level
        RETURN r
        """
        self.db.query(query, {'username': username, 'skill_name': skill_name, 'level': level})
        return {"success": True}

    def add_internship_requirement(self, title: str, skill_name: str, level_required: int):
        query = """
        MATCH (i:Internship {title: $title}), (s:Skill {name: $skill_name})
        MERGE (i)-[r:REQUIRES_SKILL]->(s)
        SET r.level_required = $level_required
        RETURN r
        """
        self.db.query(query, {'title': title, 'skill_name': skill_name, 'level_required': level_required})
        return {"success": True}

    def link_related_skills(self, skill1: str, skill2: str):
        query = """
        MATCH (s1:Skill {name: $skill1}), (s2:Skill {name: $skill2})
        MERGE (s1)-[:RELATED_TO]->(s2)
        MERGE (s2)-[:RELATED_TO]->(s1)
        """
        self.db.query(query, {'skill1': skill1, 'skill2': skill2})
        return {"success": True}

    def apply_to_internship(self, username: str, title: str, status: str = "Applied"):
        query = """
        MATCH (u:Student {username: $username}), (i:Internship {title: $title})
        MERGE (u)-[r:APPLIED_TO]->(i)
        SET r.status = $status
        RETURN r
        """
        self.db.query(query, {'username': username, 'title': title, 'status': status})
        return {"success": True}

    def get_skill_gap(self, username: str, internship_title: str):
        # 1. Compare Student to Internship nodes
        # 2. Identify missing skills required by the internship that the student DOES NOT HAVE
        missing_skills_query = """
        MATCH (i:Internship {title: $title})-[:REQUIRES_SKILL]->(req:Skill)
        WHERE NOT EXISTS {
            MATCH (u:Student {username: $username})-[:HAS_SKILL]->(req)
        }
        RETURN req.name AS missing_skill
        """
        try:
            missing_res = self.db.query(missing_skills_query, {'username': username, 'title': internship_title})
            missing_skills = [record[0] for record in missing_res.result_set]
            
            # 3. Suggest a learning path by finding skills 1 or 2 edges away from the student's current skills
            # that are REQUIRED by the internship.
            paths = []
            if missing_skills:
                learning_path_query = """
                MATCH (u:Student {username: $username})-[:HAS_SKILL]->(current:Skill)
                MATCH p = (current)-[:RELATED_TO*1..2]-(missing:Skill)
                WHERE missing.name IN $missing_skills
                RETURN missing.name AS missing_skill, [n IN nodes(p) | n.name] AS path
                """
                paths_res = self.db.query(learning_path_query, {'username': username, 'missing_skills': missing_skills})
                for record in paths_res.result_set:
                    paths.append({
                        "missing_skill": record[0],
                        "suggested_path": record[1]
                    })

            return {
                "missing_skills": missing_skills,
                "learning_paths": paths
            }
        except Exception as e:
            print(f"Graph query error: {e}")
            return {"error": str(e)}

    def match_students_to_internship(self, title: str):
        # Calculate percentage of required skills a student has
        query = """
        MATCH (i:Internship {title: $title})-[:REQUIRES_SKILL]->(req:Skill)
        WITH i, count(req) as total_required
        MATCH (u:Student)-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES_SKILL]-(i)
        WITH u, total_required, count(s) as matched_skills
        RETURN u.username as student, matched_skills, total_required,
               (toFloat(matched_skills) / total_required) * 100 AS match_percentage
        ORDER BY match_percentage DESC
        """
        try:
            res = self.db.query(query, {'title': title})
            matches = []
            for record in res.result_set:
                matches.append({
                    "student": record[0],
                    "matched_skills": record[1],
                    "total_required": record[2],
                    "match_percentage": record[3]
                })
            return matches
        except Exception as e:
            print(f"Graph query error: {e}")
            return {"error": str(e)}
