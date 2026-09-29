import io

def test_file_upload_and_signed_url(client, auth_headers):
    # Create fake image bytes
    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"dummyimagecontent"*20)
    files = {"file": ("test_cert.jpg", fake_image, "image/jpeg")}
    data = {"category": "skills"}

    res = client.post("/api/files/upload", headers=auth_headers, files=files, data=data)
    assert res.status_code == 201
    file_data = res.json()["data"]
    assert "storage_path" in file_data
    assert "public_url" in file_data
    file_id = file_data["file_id"]

    # Test signed URL generation
    signed_res = client.get(f"/api/files/{file_id}/signed-url", headers=auth_headers)
    assert signed_res.status_code == 200
    assert "signature=" in signed_res.json()["data"]["signed_url"]

    # Test file deletion
    del_res = client.delete(f"/api/files/{file_id}", headers=auth_headers)
    assert del_res.status_code == 200

def test_invalid_file_extension_rejected(client, auth_headers):
    fake_exe = io.BytesIO(b"MZ\x90\x00executablecontent")
    files = {"file": ("malicious.exe", fake_exe, "application/x-msdownload")}
    res = client.post("/api/files/upload", headers=auth_headers, files=files, data={"category": "skills"})
    assert res.status_code == 400
    assert "not permitted" in res.json()["detail"]
