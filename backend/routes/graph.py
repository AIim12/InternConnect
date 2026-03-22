from fastapi import APIRouter, Depends
from backend.repositories.match_repo import MatchRepository

router = APIRouter(prefix="/graph", tags=["graph"])

def get_match_repo():
    return MatchRepository()

@router.get("/export")
def get_full_graph(repo: MatchRepository = Depends(get_match_repo)):
    """Exports the subgraph of Skills and their relationships for the UI."""
    if not repo.db:
        # Fallback Mock Data if FalkorDB is offline
        return {
            "nodes": [
                {"id": "Python", "group": 1, "val": 25},
                {"id": "FastAPI", "group": 1, "val": 15},
                {"id": "React", "group": 2, "val": 20},
                {"id": "Tailwind", "group": 2, "val": 12},
                {"id": "DataScience", "group": 3, "val": 18},
                {"id": "AWS", "group": 4, "val": 15},
                {"id": "Docker", "group": 4, "val": 12},
                {"id": "TypeScript", "group": 2, "val": 18}
            ],
            "links": [
                {"source": "Python", "target": "FastAPI"},
                {"source": "Python", "target": "DataScience"},
                {"source": "React", "target": "Tailwind"},
                {"source": "React", "target": "TypeScript"},
                {"source": "AWS", "target": "Docker"}
            ]
        }
    
    try:
        nodes_res = repo.db.query("MATCH (s:Skill) RETURN s.name, s.domain")
        links_res = repo.db.query("MATCH (s1:Skill)-[:RELATED_TO]->(s2:Skill) RETURN s1.name, s2.name")
        
        nodes = []
        domain_groups = {"Backend": 1, "Frontend": 2, "AI": 3, "DevOps": 4, "Database": 5}
        
        for record in nodes_res.result_set:
            domain = record[1]
            nodes.append({
                "id": record[0],
                "group": domain_groups.get(domain, 0),
                "val": 15
            })
            
        links = []
        for record in links_res.result_set:
            links.append({
                "source": record[0],
                "target": record[1]
            })
            
        return {"nodes": nodes, "links": links}
    except Exception as e:
        return {"error": str(e)}
