import requests
import json
import time

BASE_URL = "http://127.0.0.1:8080"

def test_flow():
    print("=== Testing AetherMind API Flow ===")
    
    # 1. Login as Admin
    print("\n[1] Logging in as Admin...")
    login_payload = {"username": "admin", "password": "admin123"}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    admin_data = resp.json()
    admin_token = admin_data["access_token"]
    print("Success! Token received.")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 2. Get Users to assign a task
    print("\n[2] Fetching users list...")
    resp = requests.get(f"{BASE_URL}/auth/users", headers=headers)
    assert resp.status_code == 200, f"Get users failed: {resp.text}"
    users = resp.json()
    user_id = None
    for u in users:
        if u["username"] == "user":
            user_id = u["id"]
            break
    print(f"Success! Found user 'user' with ID: {user_id}")
    
    # 3. Create a Task (Admin only)
    print("\n[3] Creating task assigned to standard user...")
    task_payload = {
        "title": "Analyze Q2 Financial Report",
        "description": "Please search the uploaded document to find details about marketing spend and complete this task.",
        "assigned_to": user_id,
        "priority": "High"
    }
    resp = requests.post(f"{BASE_URL}/tasks", json=task_payload, headers=headers)
    assert resp.status_code == 200, f"Create task failed: {resp.text}"
    task = resp.json()
    task_id = task["id"]
    print(f"Success! Task created with ID: {task_id}")
    
    # 4. Filter Tasks (dynamic filtering)
    print("\n[4] Querying tasks with filters...")
    # Filter by assignee
    resp = requests.get(f"{BASE_URL}/tasks?assigned_to={user_id}", headers=headers)
    assert resp.status_code == 200, f"Filter by assignee failed: {resp.text}"
    print(f"Tasks assigned to standard user: {len(resp.json())} tasks found.")
    
    # Filter by status
    resp = requests.get(f"{BASE_URL}/tasks?status=Pending", headers=headers)
    assert resp.status_code == 200, f"Filter by status failed: {resp.text}"
    print(f"Pending tasks in system: {len(resp.json())} tasks found.")
    
    # Filter by priority
    resp = requests.get(f"{BASE_URL}/tasks?priority=High", headers=headers)
    assert resp.status_code == 200, f"Filter by priority failed: {resp.text}"
    print(f"High priority tasks in system: {len(resp.json())} tasks found.")
    
    # 5. Upload a document
    print("\n[5] Uploading a test knowledge document...")
    doc_content = (
        "AetherMind System Architecture Overview.\n"
        "This project uses FastAPI as backend, React as frontend, and MySQL for relational storage.\n"
        "For semantic search, text segments are converted into dense vector embeddings and stored in FAISS.\n"
        "Marketing spend for Q2 was designated at fifty thousand dollars ($50,000) for campaign growth.\n"
    )
    # Create temporary file
    with open("temp_doc.txt", "w", encoding="utf-8") as f:
        f.write(doc_content)
        
    try:
        with open("temp_doc.txt", "rb") as file_data:
            files = {"file": ("temp_doc.txt", file_data, "text/plain")}
            data = {"title": "AetherMind Specs"}
            resp = requests.post(f"{BASE_URL}/documents", data=data, files=files, headers=headers)
            
        assert resp.status_code == 200, f"Document upload failed: {resp.text}"
        print("Success! Document uploaded and indexed in FAISS.")
    finally:
        import os
        if os.path.exists("temp_doc.txt"):
            os.remove("temp_doc.txt")
            
    # 6. Execute Semantic Search
    print("\n[6] Running semantic search query...")
    search_query = "What was the marketing spend in Q2?"
    resp = requests.get(f"{BASE_URL}/search?q={search_query}", headers=headers)
    assert resp.status_code == 200, f"Search failed: {resp.text}"
    search_results = resp.json()
    print(f"Query: '{search_results['query']}'")
    for r in search_results["results"]:
        print(f" - [{r['document_title']}] (Match: {int(r['score']*100)}%): '{r['chunk_text']}'")
        
    # 7. User updates task status (Pending -> Completed)
    print("\n[7] Logging in as standard user to complete the task...")
    login_payload = {"username": "user", "password": "user123"}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert resp.status_code == 200, f"User login failed: {resp.text}"
    user_token = resp.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    print("Updating task status to Completed...")
    update_payload = {"status": "Completed"}
    resp = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_payload, headers=user_headers)
    assert resp.status_code == 200, f"Update status failed: {resp.text}"
    print(f"Success! Task status updated: {resp.json()['status']}")
    
    # 8. Check Analytics
    print("\n[8] Checking system analytics dashboard metrics...")
    resp = requests.get(f"{BASE_URL}/analytics", headers=headers)
    assert resp.status_code == 200, f"Get analytics failed: {resp.text}"
    analytics = resp.json()
    print("Analytics Metrics:")
    print(f" - Total Tasks: {analytics['total_tasks']}")
    print(f" - Completed Tasks: {analytics['completed_tasks']}")
    print(f" - Pending Tasks: {analytics['pending_tasks']}")
    print(f" - Total Documents: {analytics['total_documents']}")
    print(f" - Top Search Queries: {analytics['top_queries']}")
    
    # 9. Check Activity Logs
    print("\n[9] Checking audit logs feed...")
    resp = requests.get(f"{BASE_URL}/analytics/logs", headers=headers)
    assert resp.status_code == 200, f"Get logs failed: {resp.text}"
    logs = resp.json()
    print("Recent Activities (Top 5):")
    for l in logs[:5]:
        print(f" - [{l['created_at']}] {l['username']} -> {l['action']}: {l['details']}")
        
    # 10. Admin Deletes the Task
    print("\n[10] Admin deleting the task...")
    resp = requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    assert resp.status_code == 204, f"Delete task failed: {resp.text}"
    print("Success! Task deleted (204 No Content).")
    
    resp = requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    assert resp.status_code == 404, f"Subsequent delete should fail: {resp.text}"
    print("Success! Verified 404 returned on deleted task.")
        
    print("\n=== All Tests Passed Flawlessly! ===")

if __name__ == "__main__":
    # Give the server a second to boot up
    time.sleep(1)
    test_flow()
