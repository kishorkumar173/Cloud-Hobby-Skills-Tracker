def test_create_and_fetch_community_post(client, auth_headers):
    # Create post
    res = client.post("/api/posts", headers=auth_headers, json={
        "content": "Just completed my first hour of practice on the platform!",
        "media_url": "https://example.com/proof.jpg"
    })
    assert res.status_code == 201
    post_id = res.json()["data"]["post_id"]

    # Fetch feed
    feed_res = client.get("/api/feed", headers=auth_headers)
    assert feed_res.status_code == 200
    posts = feed_res.json()["data"]
    assert any(p["post_id"] == post_id for p in posts)

def test_like_and_unlike_post(client, auth_headers):
    # Fetch latest post
    feed_res = client.get("/api/feed", headers=auth_headers)
    post_id = feed_res.json()["data"][0]["post_id"]

    # Like post
    like_res = client.post(f"/api/posts/{post_id}/like", headers=auth_headers)
    assert like_res.status_code == 200
    assert like_res.json()["data"]["is_liked"] is True

    # Duplicate like should be idempotent (prevent duplicate rows)
    dup_like = client.post(f"/api/posts/{post_id}/like", headers=auth_headers)
    assert dup_like.status_code == 200

    # Unlike post
    unlike_res = client.delete(f"/api/posts/{post_id}/like", headers=auth_headers)
    assert unlike_res.status_code == 200
    assert unlike_res.json()["data"]["is_liked"] is False

def test_comment_on_post(client, auth_headers):
    feed_res = client.get("/api/feed", headers=auth_headers)
    post_id = feed_res.json()["data"][0]["post_id"]

    res = client.post(f"/api/posts/{post_id}/comments", headers=auth_headers, json={
        "content": "Awesome milestone! Keep up the great consistency."
    })
    assert res.status_code == 201
    assert res.json()["data"]["content"] == "Awesome milestone! Keep up the great consistency."

    # Check comments list
    comments_res = client.get(f"/api/posts/{post_id}/comments")
    assert comments_res.status_code == 200
    assert len(comments_res.json()["data"]) >= 1
