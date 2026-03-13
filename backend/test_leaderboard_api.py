from fastapi.testclient import TestClient
from app.main import app

def test_leaderboard_api():
    client = TestClient(app)
    response = client.get("/api/leaderboard")
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")

if __name__ == "__main__":
    test_leaderboard_api()
