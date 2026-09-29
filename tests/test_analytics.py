def test_dashboard_analytics(client, auth_headers):
    res = client.get("/api/analytics/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_practice_hours" in data
    assert "current_streak" in data
    assert "longest_streak" in data
    assert "hours_by_skill" in data
    assert "weekly_trend" in data
    assert "badges" in data
    assert len(data["badges"]) >= 6

def test_community_analytics(client):
    res = client.get("/api/analytics/community")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_learners" in data
    assert "total_skills_tracked" in data
    assert "total_practice_hours" in data
    assert "total_posts_shared" in data
