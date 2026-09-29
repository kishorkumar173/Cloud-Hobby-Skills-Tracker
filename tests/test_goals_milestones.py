def test_create_goal_with_milestones(client, auth_headers):
    # Ensure a skill exists
    skill_res = client.post("/api/skills", headers=auth_headers, json={
        "skill_name": "Classical Piano",
        "category": "Music"
    })
    skill_id = skill_res.json()["data"]["skill_id"]

    res = client.post("/api/goals", headers=auth_headers, json={
        "skill_id": skill_id,
        "title": "Practice 40 Hours of Piano",
        "target_value": 40.0,
        "current_value": 0.0,
        "unit": "hours"
    })
    assert res.status_code == 201
    goal_id = res.json()["data"]["goal_id"]

    # Retrieve goals
    goals_res = client.get("/api/goals", headers=auth_headers)
    assert goals_res.status_code == 200
    goal = next(g for g in goals_res.json()["data"] if g["goal_id"] == goal_id)
    assert goal["title"] == "Practice 40 Hours of Piano"
    assert len(goal["milestones"]) == 4  # Auto-generated 25%, 50%, 75%, 100%

def test_toggle_milestone(client, auth_headers):
    goals_res = client.get("/api/goals", headers=auth_headers)
    milestone = goals_res.json()["data"][0]["milestones"][0]
    m_id = milestone["milestone_id"]

    res = client.put(f"/api/goals/milestones/{m_id}", headers=auth_headers, json={"achieved": True})
    assert res.status_code == 200
    assert res.json()["data"]["achieved"] is True
