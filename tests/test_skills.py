def test_create_skill(client, auth_headers):
    res = client.post("/api/skills", headers=auth_headers, json={
        "skill_name": "Digital Illustration",
        "category": "Art",
        "current_level": "BEGINNER",
        "target_level": "ADVANCED",
        "status": "ACTIVE",
        "description": "Learning Procreate on iPad",
        "icon": "Palette"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert data["data"]["skill_name"] == "Digital Illustration"
    assert "skill_id" in data["data"]

def test_list_skills(client, auth_headers):
    res = client.get("/api/skills", headers=auth_headers)
    assert res.status_code == 200
    skills = res.json()["data"]
    assert len(skills) >= 1
    assert any(s["skill_name"] == "Digital Illustration" for s in skills)

def test_update_skill(client, auth_headers):
    # Fetch first skill
    res = client.get("/api/skills", headers=auth_headers)
    skill_id = res.json()["data"][0]["skill_id"]

    res_update = client.put(f"/api/skills/{skill_id}", headers=auth_headers, json={
        "current_level": "INTERMEDIATE"
    })
    assert res_update.status_code == 200

    # Verify update
    detail = client.get(f"/api/skills/{skill_id}", headers=auth_headers)
    assert detail.json()["data"]["current_level"] == "INTERMEDIATE"

def test_delete_skill(client, auth_headers):
    # Create temporary skill to delete
    res = client.post("/api/skills", headers=auth_headers, json={
        "skill_name": "Temporary Skill",
        "category": "Other",
        "current_level": "BEGINNER",
        "target_level": "BEGINNER",
        "status": "ACTIVE"
    })
    temp_id = res.json()["data"]["skill_id"]

    del_res = client.delete(f"/api/skills/{temp_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Ensure not found
    get_res = client.get(f"/api/skills/{temp_id}", headers=auth_headers)
    assert get_res.status_code == 404
