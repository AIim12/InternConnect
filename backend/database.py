from falkordb import FalkorDB

class GraphDatabase:
    _instance = None

    def __new__(cls, host='localhost', port=6379):
        if cls._instance is None:
            cls._instance = super(GraphDatabase, cls).__new__(cls)
            try:
                cls._instance.client = FalkorDB(host=host, port=port)
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
