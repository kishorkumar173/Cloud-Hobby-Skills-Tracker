def test_log_practice_session(client, auth_headers):
    # Fetch skill
    skills = client.get("/api/skills", headers=auth_headers).json()["data"]
    skill_id = skills[0]["skill_id"]

    res = client.post("/api/practice", headers=auth_headers, json={
        "skill_id": skill_id,
        "duration_minutes": 60,
        "activity": "Scales and arpeggios speed drills",
        "notes": "Metronome at 120 bpm, very clean finger motion."
    })
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["duration_minutes"] == 60
    assert data["current_streak"] >= 1

def test_practice_history(client, auth_headers):
    res = client.get("/api/practice", headers=auth_headers)
    assert res.status_code == 200
    sessions = res.json()["data"]
    assert len(sessions) >= 1
    assert sessions[0]["duration_minutes"] == 60
