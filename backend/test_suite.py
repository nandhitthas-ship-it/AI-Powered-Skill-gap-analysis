import io
import json
import unittest
import fitz
from backend.app import app, get_db, initialize_database


class LocalPlatformTests(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["database"], "sqlite")
        self.assertEqual(data["ml_library"], "scikit-learn")

    def test_auth_workflow(self):
        # 1. Register new student
        unique_email = "test_student@example.com"
        reg_response = self.client.post(
            "/api/register",
            json={"name": "Alex Taylor", "email": unique_email, "password": "Password123!"},
        )
        # 201 or 409 if already exists
        if reg_response.status_code == 409:
            login_response = self.client.post(
                "/api/login",
                json={"email": unique_email, "password": "Password123!"},
            )
            self.assertEqual(login_response.status_code, 200)
        else:
            self.assertEqual(reg_response.status_code, 201)

        # Verify session
        session_res = self.client.get("/api/session")
        self.assertEqual(session_res.status_code, 200)
        self.assertIsNotNone(session_res.get_json()["user"])

        # 2. Update student profile
        profile_update = self.client.put(
            "/api/profile",
            json={
                "name": "Alex Taylor",
                "education": "B.S. Information Technology",
                "career_goal": "Cybersecurity Analyst",
                "skills": {"Linux": "strong", "Networking": "improving"},
                "interests": ["security", "systems", "investigation"],
            },
        )
        self.assertEqual(profile_update.status_code, 200)
        user_data = profile_update.get_json()["profile"]
        self.assertEqual(user_data["career_goal"], "Cybersecurity Analyst")
        self.assertIn("Linux", user_data["skills"])

        # 3. Test Dashboard and Recommendations
        dash_res = self.client.get("/api/dashboard")
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.get_json()
        self.assertTrue(len(dash_data["recommendations"]) >= 6)
        # Verify TF-IDF and skill gap classifications
        top_rec = dash_data["recommendations"][0]
        self.assertIn("tfidf_similarity", top_rec)
        self.assertIn("skill_coverage", top_rec)
        self.assertIn("reasons", top_rec)
        self.assertIn("strong", dash_data["skill_gap"])
        self.assertIn("improving", dash_data["skill_gap"])
        self.assertIn("missing", dash_data["skill_gap"])

        # 4. Test Resume PDF Upload with PyMuPDF
        # Generate in-memory PDF with sample text
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 72), "Alex Taylor - Resume\nSkills: Python, Git, SQL, Docker, Linux, Networking")
        pdf_bytes = doc.tobytes()
        doc.close()

        resume_res = self.client.post(
            "/api/resume",
            data={"resume": (io.BytesIO(pdf_bytes), "sample_resume.pdf")},
            content_type="multipart/form-data",
        )
        self.assertEqual(resume_res.status_code, 200)
        extracted = resume_res.get_json()["extracted_skills"]
        self.assertIn("Python", extracted)
        self.assertIn("Git", extracted)
        self.assertIn("SQL", extracted)

        # 5. What-if Career Simulation
        sim_res = self.client.post(
            "/api/simulate",
            json={"skill": "Cybersecurity"},
        )
        self.assertEqual(sim_res.status_code, 200)
        sim_data = sim_res.get_json()
        self.assertEqual(sim_data["added_skill"], "Cybersecurity")
        self.assertEqual(len(sim_data["before"]), len(sim_data["after"]))

        # 6. Learning Roadmap & Progress update
        roadmap_res = self.client.get("/api/roadmap?role=cybersecurity-analyst")
        self.assertEqual(roadmap_res.status_code, 200)
        roadmap_items = roadmap_res.get_json()["items"]
        self.assertTrue(len(roadmap_items) > 0)
        first_item_id = roadmap_items[0]["id"]

        progress_patch = self.client.patch(
            "/api/progress",
            json={"role_slug": "cybersecurity-analyst", "item_id": first_item_id, "completed": True},
        )
        self.assertEqual(progress_patch.status_code, 200)

        # Verify progress persistence
        updated_roadmap = self.client.get("/api/roadmap?role=cybersecurity-analyst").get_json()
        self.assertTrue(updated_roadmap["items"][0]["completed"])

        # 7. Logout
        logout_res = self.client.post("/api/logout")
        self.assertEqual(logout_res.status_code, 200)
        post_logout_session = self.client.get("/api/session").get_json()
        self.assertIsNone(post_logout_session["user"])


if __name__ == "__main__":
    unittest.main()

