import json
import os
import re
import sqlite3
from pathlib import Path

import fitz
from flask import Flask, g, jsonify, request, session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "skillpath.sqlite3"
SKILL_LEVELS = {"strong", "improving"}

CAREERS = [
    {
        "slug": "full-stack-developer",
        "title": "Full Stack Developer",
        "description": "Build complete web products across responsive interfaces, APIs, and data layers.",
        "skills": ["JavaScript", "React", "HTML/CSS", "Node.js", "REST APIs", "SQL", "Git"],
        "interests": ["web development", "building products", "design"],
        "roadmap": [
            ("core-web", "Strengthen web foundations", "Practice semantic HTML, modern CSS, JavaScript, and Git in a small responsive site.", "Course"),
            ("react-ui", "Build a React interface", "Create a multi-page React app with accessible forms, reusable components, and state.", "Project"),
            ("api-data", "Connect an API and database", "Build a REST API, persist data in SQLite, and handle loading and error states.", "Project"),
            ("ship-fullstack", "Ship a full-stack portfolio app", "Deploy locally with a clear README, tests, and a short architecture explanation.", "Milestone"),
        ],
    },
    {
        "slug": "data-analyst",
        "title": "Data Analyst",
        "description": "Turn structured data into clear answers, dashboards, and practical decisions.",
        "skills": ["SQL", "Excel", "Python", "Statistics", "Power BI", "Data Visualization", "Communication"],
        "interests": ["data", "business", "research", "problem solving"],
        "roadmap": [
            ("analyst-sql", "Query data with SQL", "Use joins, grouping, and window functions to answer questions from a public dataset.", "Course"),
            ("analyst-stats", "Practice analytical reasoning", "Explore distributions, sampling, and uncertainty; write down assumptions before conclusions.", "Course"),
            ("analyst-dashboard", "Create a decision dashboard", "Build a Power BI or Python dashboard with a focused question and annotated findings.", "Project"),
            ("analyst-case", "Publish an analysis case study", "Document your method, data limits, findings, and recommended next action.", "Milestone"),
        ],
    },
    {
        "slug": "data-scientist",
        "title": "Data Scientist",
        "description": "Use statistics, code, and experiments to find patterns and make useful predictions.",
        "skills": ["Python", "Statistics", "SQL", "Machine Learning", "Scikit-learn", "Data Visualization", "Problem Solving"],
        "interests": ["data", "research", "machine learning", "experimentation"],
        "roadmap": [
            ("science-python", "Build a Python data workflow", "Clean, inspect, and visualize a dataset with reproducible notebooks or scripts.", "Course"),
            ("science-stats", "Learn statistical foundations", "Compare groups, explain uncertainty, and choose metrics that fit a question.", "Course"),
            ("science-model", "Train and evaluate a baseline", "Use scikit-learn with a held-out test set, a simple baseline, and suitable metrics.", "Project"),
            ("science-report", "Write a model card", "Explain intended use, limitations, data leakage risks, and model performance clearly.", "Milestone"),
        ],
    },
    {
        "slug": "machine-learning-engineer",
        "title": "Machine Learning Engineer",
        "description": "Turn reliable machine-learning experiments into tested, maintainable software.",
        "skills": ["Python", "Machine Learning", "Scikit-learn", "REST APIs", "SQL", "Git", "Linux"],
        "interests": ["machine learning", "building products", "automation", "engineering"],
        "roadmap": [
            ("mle-python", "Write production-ready Python", "Package a data workflow, add type hints and tests, and handle invalid input safely.", "Course"),
            ("mle-evaluation", "Evaluate a model responsibly", "Create a reproducible scikit-learn pipeline and compare it with a baseline.", "Project"),
            ("mle-api", "Serve predictions through an API", "Expose a local model behind a Flask API with validation and useful error responses.", "Project"),
            ("mle-ops", "Document model operations", "Describe versioning, monitoring signals, retraining triggers, and known limitations.", "Milestone"),
        ],
    },
    {
        "slug": "cybersecurity-analyst",
        "title": "Cybersecurity Analyst",
        "description": "Protect systems by understanding networks, operating systems, threats, and controls.",
        "skills": ["Networking", "Linux", "Cybersecurity", "Python", "SQL", "Communication", "Problem Solving"],
        "interests": ["security", "investigation", "systems", "problem solving"],
        "roadmap": [
            ("security-network", "Map networking fundamentals", "Practice IP addressing, DNS, HTTP, ports, and common network troubleshooting.", "Course"),
            ("security-linux", "Work comfortably in Linux", "Use shell tools, permissions, logs, and process inspection in a local lab.", "Course"),
            ("security-lab", "Complete a defensive lab", "Analyze sample logs and write a concise incident timeline with evidence and next steps.", "Project"),
            ("security-portfolio", "Build a security portfolio", "Publish lab notes that avoid real personal data and explain defensive mitigations.", "Milestone"),
        ],
    },
    {
        "slug": "ui-ux-designer",
        "title": "UI/UX Designer",
        "description": "Make digital products easier to understand through research, interaction, and visual design.",
        "skills": ["Figma", "UX Research", "Wireframing", "Prototyping", "HTML/CSS", "Communication", "Problem Solving"],
        "interests": ["design", "research", "people", "building products"],
        "roadmap": [
            ("design-research", "Plan focused user research", "Write neutral interview questions and synthesize observations into themes.", "Course"),
            ("design-wireframe", "Map a user journey", "Create a journey map and low-fidelity wireframes for one specific user task.", "Project"),
            ("design-prototype", "Prototype and test", "Build a clickable Figma prototype and run a small usability review with consent.", "Project"),
            ("design-case", "Tell the design story", "Present constraints, iterations, evidence, accessibility choices, and outcomes in a case study.", "Milestone"),
        ],
    },
]

SKILL_CATALOG = [
    "Communication", "Cybersecurity", "Data Visualization", "Excel", "Figma", "Git",
    "HTML/CSS", "JavaScript", "Linux", "Machine Learning", "Networking", "Node.js",
    "Power BI", "Problem Solving", "Prototyping", "Python", "React", "REST APIs",
    "Scikit-learn", "SQL", "Statistics", "Tableau", "TensorFlow", "UX Research",
    "Wireframing",
]

SKILL_ALIASES = {
    "HTML/CSS": ["html", "css", "html5", "css3"],
    "Node.js": ["node.js", "nodejs", "node js"],
    "REST APIs": ["rest api", "rest apis", "restful api", "api development"],
    "Scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
    "UX Research": ["ux research", "user research", "usability testing"],
    "Data Visualization": ["data visualization", "data visualisation", "data viz"],
    "Machine Learning": ["machine learning", "ml model", "predictive modeling"],
    "Power BI": ["power bi", "powerbi"],
    "JavaScript": ["javascript", "js"],
    "React": ["react", "react.js", "reactjs"],
    "Python": ["python", "pandas", "numpy"],
    "Cybersecurity": ["cybersecurity", "information security", "threat analysis"],
}


app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("SKILLPATH_SECRET_KEY", "local-development-key-change-before-sharing"),
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("SKILLPATH_SECURE_COOKIES") == "1",)


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def json_value(value, fallback):
    try:
        return json.loads(value) if value else fallback
    except (TypeError, json.JSONDecodeError):
        return fallback


def public_user(row):
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "education": row["education"],
        "skills": json_value(row["skills"], {}),
        "interests": json_value(row["interests"], []),
        "career_goal": row["career_goal"],
    }


def current_user():
    user_id = session.get("user_id")
    if user_id is None:
        return None
    return get_db().execute("SELECT * FROM students WHERE id = ?", (user_id,)).fetchone()


def initialize_database():
    connection = sqlite3.connect(DATABASE)
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            education TEXT NOT NULL DEFAULT '',
            skills TEXT NOT NULL DEFAULT '{}',
            interests TEXT NOT NULL DEFAULT '[]',
            career_goal TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS learning_progress (
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            role_slug TEXT NOT NULL,
            item_id TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (student_id, role_slug, item_id)
        );
        """
    )
    demo = connection.execute("SELECT id FROM students WHERE email = ?", ("demo@skillpath.local",)).fetchone()
    if demo is None:
        connection.execute(
            """INSERT INTO students (name, email, password_hash, education, skills, interests, career_goal)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                "Jordan Lee", "demo@skillpath.local", generate_password_hash("Demo123!"),
                "B.Sc. Computer Science · Year 3",
                json.dumps({"Python": "strong", "SQL": "strong", "Statistics": "improving", "Git": "improving", "Data Visualization": "improving"}),
                json.dumps(["data", "research", "problem solving"]), "Data Analyst",
            ),
        )
    connection.commit()
    connection.close()


def authorized_user():
    user = current_user()
    if user is None:
        return None, (jsonify({"error": "Please sign in to continue."}), 401)
    return user, None


def interest_score(student_interests, career):
    interests = {str(item).strip().lower() for item in student_interests if str(item).strip()}
    if not interests:
        return 0
    role_interests = set(career["interests"])
    return len(interests & role_interests) / len(role_interests)


def career_text_representation(career):
    skills_text = " ".join(career["skills"])
    interests_text = " ".join(career["interests"])
    roadmap_text = " ".join(f"{title} {desc}" for _, title, desc, _ in career["roadmap"])
    return f"{career['title']} {career['description']} {skills_text} {interests_text} {roadmap_text}".lower()


def student_text_representation(skills, interests, education="", goal=""):
    strong = [s for s, level in skills.items() if level == "strong"]
    improving = [s for s, level in skills.items() if level == "improving"]
    # Give strong skills increased term frequency
    skills_expanded = " ".join(strong + strong + improving)
    interests_text = " ".join(str(i) for i in interests)
    return f"{goal} {education} {skills_expanded} {interests_text}".lower().strip()


def compute_tfidf_similarities(student_text):
    if not student_text:
        return {career["slug"]: 0.0 for career in CAREERS}
    career_texts = [career_text_representation(c) for c in CAREERS]
    corpus = career_texts + [student_text]
    try:
        vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b[\w\-\/\.]+\b", stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(corpus)
        sim_matrix = cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1])
        return {CAREERS[i]["slug"]: float(sim_matrix[0][i]) for i in range(len(CAREERS))}
    except Exception:
        return {career["slug"]: 0.0 for career in CAREERS}


def recommendations(student, skills_override=None):
    skills = skills_override if skills_override is not None else json_value(student["skills"], {})
    interests = json_value(student["interests"], [])
    goal = (student["career_goal"] or "").strip().lower()
    education = (student["education"] or "").strip()

    student_text = student_text_representation(skills, interests, education, goal)
    tfidf_sims = compute_tfidf_similarities(student_text)

    results = []
    for career in CAREERS:
        known = [skill for skill in career["skills"] if skills.get(skill) in SKILL_LEVELS]
        skill_points = sum(1.0 if skills[skill] == "strong" else 0.6 for skill in known)
        skill_fit = skill_points / len(career["skills"])
        interest_fit = interest_score(interests, career)
        goal_fit = 1.0 if goal == career["title"].lower() else 0.0
        tfidf_sim = tfidf_sims.get(career["slug"], 0.0)

        # Transparent composite score:
        # 50% role-specific skill coverage
        # 30% Scikit-learn TF-IDF cosine similarity
        # 15% interest alignment
        # 5% declared career goal match
        score = round(100 * (0.50 * skill_fit + 0.30 * tfidf_sim + 0.15 * interest_fit + 0.05 * goal_fit))
        score = max(0, min(100, score))

        matched = [skill for skill in career["skills"] if skills.get(skill) in SKILL_LEVELS]
        missing = [skill for skill in career["skills"] if skill not in skills]
        improving = [skill for skill in career["skills"] if skills.get(skill) == "improving"]

        reasons = []
        if matched:
            reasons.append(f"Your profile matches {len(matched)} of {len(career['skills'])} core skills ({', '.join(matched[:3])}{' and more' if len(matched) > 3 else ''}).")
        reasons.append(f"Scikit-learn TF-IDF semantic alignment: {round(tfidf_sim * 100)}% cosine similarity.")
        overlap = [tag for tag in career["interests"] if tag in {str(value).lower() for value in interests}]
        if overlap:
            reasons.append(f"Your interests align with {', '.join(overlap[:2])}.")
        if goal_fit > 0:
            reasons.append("Matches your declared target career goal.")
        if missing:
            reasons.append(f"Build {missing[0]}{f' and {missing[1]}' if len(missing) > 1 else ''} to close the primary skill gap{'s' if len(missing) > 1 else ''}.")

        results.append({
            "slug": career["slug"],
            "title": career["title"],
            "description": career["description"],
            "score": score,
            "tfidf_similarity": round(tfidf_sim * 100, 1),
            "skill_coverage": round(skill_fit * 100, 1),
            "matched_skills": matched,
            "improving_skills": improving,
            "missing_skills": missing,
            "reasons": reasons,
        })
    return sorted(results, key=lambda item: (-item["score"], item["title"]))


def role_by_slug(slug):
    return next((career for career in CAREERS if career["slug"] == slug), None)


def roadmap_items(role):
    db = get_db()
    user_id = session["user_id"]
    progress_rows = db.execute(
        "SELECT item_id, completed FROM learning_progress WHERE student_id = ? AND role_slug = ?",
        (user_id, role["slug"]),
    ).fetchall()
    progress = {row["item_id"]: bool(row["completed"]) for row in progress_rows}
    return [
        {"id": item_id, "title": title, "description": description, "kind": kind, "completed": progress.get(item_id, False)}
        for item_id, title, description, kind in role["roadmap"]
    ]


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "database": "sqlite",
        "engine": "Scikit-learn TF-IDF Cosine Similarity & Rule-based Skill Coverage",
        "ml_library": "scikit-learn",
    })


@app.get("/api/session")
def session_info():
    return jsonify({"user": public_user(current_user()), "skill_catalog": SKILL_CATALOG})


@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if len(name) < 2 or len(name) > 80:
        return jsonify({"error": "Name must be between 2 and 80 characters."}), 400
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 160:
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 8 or len(password) > 128:
        return jsonify({"error": "Password must be between 8 and 128 characters."}), 400
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO students (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, generate_password_hash(password)),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with that email already exists."}), 409
    session.clear()
    session["user_id"] = cursor.lastrowid
    return jsonify({"user": public_user(current_user())}), 201


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    row = get_db().execute("SELECT * FROM students WHERE email = ?", (email,)).fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Email or password is incorrect."}), 401
    session.clear()
    session["user_id"] = row["id"]
    return jsonify({"user": public_user(row)})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/profile", methods=["GET", "PUT"])
def profile():
    user, error = authorized_user()
    if error:
        return error
    if request.method == "GET":
        return jsonify({"profile": public_user(user)})
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    education = str(payload.get("education", "")).strip()
    career_goal = str(payload.get("career_goal", "")).strip()
    skills = payload.get("skills", {})
    interests = payload.get("interests", [])
    if len(name) < 2 or len(name) > 80:
        return jsonify({"error": "Name must be between 2 and 80 characters."}), 400
    if len(education) > 160 or len(career_goal) > 80:
        return jsonify({"error": "Education or career goal is too long."}), 400
    if not isinstance(skills, dict) or not isinstance(interests, list):
        return jsonify({"error": "Skills and interests have an invalid format."}), 400
    clean_skills = {key: value for key, value in skills.items() if key in SKILL_CATALOG and value in SKILL_LEVELS}
    clean_interests = list(dict.fromkeys(str(value).strip().lower()[:40] for value in interests if str(value).strip()))[:12]
    get_db().execute(
        "UPDATE students SET name = ?, education = ?, skills = ?, interests = ?, career_goal = ? WHERE id = ?",
        (name, education, json.dumps(clean_skills), json.dumps(clean_interests), career_goal, user["id"]),
    )
    get_db().commit()
    return jsonify({"profile": public_user(current_user())})


@app.post("/api/resume")
def upload_resume():
    user, error = authorized_user()
    if error:
        return error
    uploaded = request.files.get("resume")
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "Choose a PDF resume to upload."}), 400
    if Path(uploaded.filename).suffix.lower() != ".pdf":
        return jsonify({"error": "Only PDF resumes are supported."}), 400
    contents = uploaded.read()
    if len(contents) > 5 * 1024 * 1024:
        return jsonify({"error": "Resume must be 5 MB or smaller."}), 413
    try:
        document = fitz.open(stream=contents, filetype="pdf")
        text = "\n".join(page.get_text() for page in document)
        document.close()
    except Exception:
        return jsonify({"error": "The PDF could not be read. Try exporting it again."}), 400
    if not text.strip():
        return jsonify({"error": "No selectable text found. Scanned PDFs need OCR before upload."}), 400
    found = []
    for skill in SKILL_CATALOG:
        aliases = SKILL_ALIASES.get(skill, [skill.lower()])
        if any(re.search(r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])", text.lower()) for alias in aliases):
            found.append(skill)
    skills = json_value(user["skills"], {})
    added = []
    for skill in found:
        if skill not in skills:
            skills[skill] = "improving"
            added.append(skill)
    get_db().execute("UPDATE students SET skills = ? WHERE id = ?", (json.dumps(skills), user["id"]))
    get_db().commit()
    return jsonify({"extracted_skills": found, "added_skills": added, "profile": public_user(current_user())})


@app.get("/api/catalog")
def catalog():
    return jsonify({"skills": SKILL_CATALOG, "career_goals": [career["title"] for career in CAREERS]})


@app.get("/api/dashboard")
def dashboard():
    user, error = authorized_user()
    if error:
        return error
    student = public_user(user)
    careers = recommendations(user)
    chosen = role_by_slug(careers[0]["slug"])
    skills = student["skills"]
    gap = {
        "strong": [skill for skill in chosen["skills"] if skills.get(skill) == "strong"],
        "improving": [skill for skill in chosen["skills"] if skills.get(skill) == "improving"],
        "missing": [skill for skill in chosen["skills"] if skill not in skills],
    }
    db = get_db()
    progress = db.execute(
        "SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS completed FROM learning_progress WHERE student_id = ?",
        (user["id"],),
    ).fetchone()
    roadmap_total = sum(len(career["roadmap"]) for career in CAREERS)
    done_total = progress["completed"]
    skill_counts = {level: sum(1 for value in skills.values() if value == level) for level in ("strong", "improving")}
    skill_counts["missing"] = max(0, len(SKILL_CATALOG) - len(skills))
    return jsonify({
        "student": student,
        "recommendations": careers,
        "focus_role": {"title": chosen["title"], "slug": chosen["slug"]},
        "skill_gap": gap,
        "skill_counts": skill_counts,
        "progress": {"completed": done_total, "total": roadmap_total, "percent": round(100 * done_total / roadmap_total) if roadmap_total else 0},
        "profile_completion": min(100, round(25 * bool(student["education"]) + 25 * bool(skills) + 25 * bool(student["interests"]) + 25 * bool(student["career_goal"]))),
    })


@app.get("/api/careers")
def career_list():
    user, error = authorized_user()
    if error:
        return error
    return jsonify({"careers": recommendations(user)})


@app.post("/api/simulate")
def simulate():
    user, error = authorized_user()
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    skill = payload.get("skill")
    if skill not in SKILL_CATALOG:
        return jsonify({"error": "Choose a skill from the catalog."}), 400
    current = json_value(user["skills"], {})
    if skill in current:
        return jsonify({"error": "That skill is already in your profile."}), 400
    simulated = dict(current)
    simulated[skill] = "improving"
    return jsonify({"added_skill": skill, "before": recommendations(user), "after": recommendations(user, simulated)})


@app.get("/api/roadmap")
def roadmap():
    user, error = authorized_user()
    if error:
        return error
    slug = request.args.get("role", "")
    role = role_by_slug(slug)
    if role is None:
        return jsonify({"error": "Choose a supported career path."}), 404
    items = roadmap_items(role)
    return jsonify({"role": {"slug": role["slug"], "title": role["title"], "description": role["description"]}, "items": items})


@app.patch("/api/progress")
def update_progress():
    user, error = authorized_user()
    if error:
        return error
    payload = request.get_json(silent=True) or {}
    role = role_by_slug(payload.get("role_slug", ""))
    item_id = payload.get("item_id")
    completed = payload.get("completed")
    if role is None or not isinstance(completed, bool):
        return jsonify({"error": "Progress update is invalid."}), 400
    if item_id not in {item[0] for item in role["roadmap"]}:
        return jsonify({"error": "That roadmap item does not exist."}), 404
    get_db().execute(
        """INSERT INTO learning_progress (student_id, role_slug, item_id, completed, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(student_id, role_slug, item_id) DO UPDATE SET completed = excluded.completed, updated_at = CURRENT_TIMESTAMP""",
        (user["id"], role["slug"], item_id, int(completed)),
    )
    get_db().commit()
    return jsonify({"ok": True})


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "Upload exceeds the 5 MB limit."}), 413


@app.errorhandler(500)
def internal_error(_error):
    return jsonify({"error": "Something went wrong locally. Please try again."}), 500


initialize_database()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")