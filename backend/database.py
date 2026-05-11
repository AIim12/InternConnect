import os
from dotenv import load_dotenv
from falkordb import FalkorDB

# Load environment variables from backend/.env when database module loads
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

class GraphDatabase:
    _instance = None

    def __new__(cls, host=None, port=None):
        if cls._instance is None:
            cls._instance = super(GraphDatabase, cls).__new__(cls)
            try:
                host = host or os.getenv('FALKORDB_HOST', 'localhost')
                port = int(port or os.getenv('FALKORDB_PORT', 6379))
                password = os.getenv('FALKORDB_PASSWORD')
                params = {'host': host, 'port': port}
                if password:
                    params['password'] = password

                cls._instance.client = FalkorDB(**params)
                cls._instance.graph = cls._instance.client.select_graph("internconnect")
                print("Connected to FalkorDB")
            except Exception as e:
                print(f"Failed to connect to FalkorDB: {e}")
                cls._instance = None
                return None
        return cls._instance

    def get_graph(self):
        return self.graph if hasattr(self, 'graph') else None

def get_db():
    db = GraphDatabase()
    if db:
        return db.get_graph()
    return None
