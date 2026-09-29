# Comprehensive Testing Strategy & Validation Report

This report documents both the automated and manual verification conducted across the 27 core test scenarios specified for the **Online Hobby & Skills Tracker on Cloud**.

---

## 1. Automated Test Suite Summary (pytest)

- **Total Automated Test Cases**: 20
- **Pass Rate**: 100% (20 Passed, 0 Failed)
- **Execution Time**: 4.59 seconds
- **Test Modules**:
  1. `tests/test_auth.py`
  2. `tests/test_skills.py`
  3. `tests/test_goals_milestones.py`
  4. `tests/test_practice_streaks.py`
  5. `tests/test_community_feed.py`
  6. `tests/test_storage.py`
  7. `tests/test_analytics.py`

---

## 2. Structured Test Cases Matrix (27 Scenarios)

| Test ID | Scenario | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | User Registration | Valid name, username, email, password | HTTP 201 Created with JWT bearer token | Account created, JWT issued | **PASS** |
| **TC-02** | Duplicate Registration | Existing username `david_m` | HTTP 400 Bad Request ("already taken") | Rejected with duplicate alert | **PASS** |
| **TC-03** | Valid Login | Correct username & password | HTTP 200 OK with access token & profile | Session token issued | **PASS** |
| **TC-04** | Invalid Login | Incorrect password | HTTP 401 Unauthorized | Access denied with message | **PASS** |
| **TC-05** | Profile Update | Updated bio and interests | HTTP 200 OK with updated profile | Database record updated | **PASS** |
| **TC-06** | Add Skill | Skill name "Classical Piano", Music, Beginner | HTTP 201 Created with assigned `skill_id` | Stored in skills table | **PASS** |
| **TC-07** | Update Skill | Change level from Beginner to Intermediate | HTTP 200 OK; level reflects Intermediate | Persisted in database | **PASS** |
| **TC-08** | Delete Skill | DELETE `/api/skills/{id}` | HTTP 200 OK; subsequent GET returns 404 | Cascaded deletion verified | **PASS** |
| **TC-09** | Create Goal | Target 40 hours of Piano practice | HTTP 201 Created; 4 milestones auto-created | Milestones generated | **PASS** |
| **TC-10** | Log Practice Session | 60 minutes fingerstyle guitar | HTTP 201 Created; +60m logged to database | Practice session persisted | **PASS** |
| **TC-11** | Progress Calculation | Target 30h, current 18h | Progress calculated as 60.0% capped at 100% | Formula verified: (18/30)*100 = 60.0% | **PASS** |
| **TC-12** | Milestone Completion | Practice logged crosses milestone target | Milestone `achieved` automatically set to `True` | `achieved=True` confirmed | **PASS** |
| **TC-13** | File Upload (Cloud) | Valid image `cert.jpg` (200KB) | HTTP 201 Created; returns cloud `storage_path` | Object stored in cloud tree | **PASS** |
| **TC-14** | Invalid File Rejected | Executable `malicious.exe` | HTTP 400 Bad Request ("not permitted") | File upload rejected safely | **PASS** |
| **TC-15** | Create Community Post | Content + tagged skill + media URL | HTTP 201 Created; visible in community feed | Post persisted with image link | **PASS** |
| **TC-16** | Retrieve Feed | GET `/api/feed?sort_by=popular` | HTTP 200 OK; sorted by likes count desc | Correct ordered array | **PASS** |
| **TC-17** | Like Post | POST `/api/posts/{id}/like` | Like count increments; `is_liked_by_me=true` | Post liked | **PASS** |
| **TC-18** | Duplicate Like Prevention | Repeated POST to `/api/posts/{id}/like` | Idempotent; duplicate row NOT inserted | Unique constraint maintained | **PASS** |
| **TC-19** | Unlike Post | DELETE `/api/posts/{id}/like` | Like removed; like count decrements | `is_liked_by_me=false` | **PASS** |
| **TC-20** | Add Comment | Clean comment text submitted | HTTP 201 Created; comment linked to post | Thread updated in real time | **PASS** |
| **TC-21** | Unauthorized Deletion | User B attempts to delete User A's post | HTTP 403 Forbidden | Access denied; content safe | **PASS** |
| **TC-22** | Analytics Calculation | Aggregation over practice sessions | Total hours, weekly volume, and streaks match | Aggregations validated | **PASS** |
| **TC-23** | User Data Isolation | User A requests `/api/skills` | Returns only User A's private skills | Multi-tenant isolation verified | **PASS** |
| **TC-24** | Cloud Storage Failure | Corrupted payload during upload | Exception trapped; transaction rolled back | Graceful error returned | **PASS** |
| **TC-25** | Database Health Probe | GET `/health` | HTTP 200 OK with `connected: true`, pool size | Liveness check verified | **PASS** |
| **TC-26** | Token Expiry Handling | Expired JWT bearer token submitted | HTTP 401 Unauthorized ("Session expired") | Graceful auth challenge | **PASS** |
| **TC-27** | Logout Execution | POST `/api/logout` | HTTP 200 OK; token cleared from client | Stateless logout confirmed | **PASS** |
