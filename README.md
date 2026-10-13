# AI-Powered Skill Gap Analysis and Personalized Career Recommendation Platform

A local prototype for student skill profiles, PDF skill extraction, transparent career matching, and saved learning progress. The interface is React + Vite; the API is Flask; data is stored in SQLite on this computer. No cloud services, paid APIs, or external AI keys are used.

## What works

- Register, sign in, and sign out with Flask sessions and Werkzeug password hashes.
- Edit education, interests, career goal, and skill proficiency; changes persist in SQLite.
- Upload a selectable-text PDF resume (up to 5 MB). PyMuPDF extracts known skill terms and adds new ones as `improving`. The uploaded file and extracted resume text are not stored. Scanned image-only PDFs need OCR and are rejected with an explanation.
- Compare six sample career paths: Full Stack Developer, Data Analyst, Data Scientist, Machine Learning Engineer, Cybersecurity Analyst, and UI/UX Designer.
- Inspect strong, improving, and missing skills; compare explanations and score estimates.
- Mark career roadmap learning steps complete. Progress persists per student and career path.
- Run a what-if simulation. The added skill is temporary and does not change the saved profile.
- View responsive dashboard charts and profile/learning progress indicators.

## Recommendation method

This prototype uses **Scikit-learn**'s `TfidfVectorizer` and `cosine_similarity` coupled with transparent skill coverage rules:
- **50% Role-Skill Coverage:** Measures direct overlap with required role competencies (`strong` = 1.0, `improving` = 0.6).
- **30% Scikit-learn TF-IDF & Cosine Similarity:** Computes semantic vector similarity between the student's profile corpus (skills, interests, education, goal) and the career role's knowledge profile.
- **15% Interest Alignment:** Measures overlap with career interest domains.
- **5% Target Goal Match:** Bonus when the student's stated career aspiration directly aligns with the role.

This provides explainable, reproducible career guidance and what-if simulation without black-box hallucinations or external API fees.

Resume extraction is a local keyword/alias match against the included skill catalog using PyMuPDF. It is not an unverified external AI parser and operates entirely on local device memory.

## Requirements

- Windows 10/11
- Node.js 18 or newer and npm
- Python 3.10 or newer with `pip`
- Visual Studio Code (optional, recommended)

## Install

Open the project folder in VS Code. Use one terminal for Flask and a second terminal for Vite.

### 1. Install frontend packages

In the project root:

```powershell
npm install
```

### 2. Create a Python environment and install Flask packages

In the project root:

```powershell
py -3 -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

If `py` is unavailable, install Python 3 from python.org, enable the PATH option, reopen VS Code, and repeat these commands. In VS Code, select `backend\.venv\Scripts\python.exe` via **Python: Select Interpreter** if prompted.

## Run in VS Code

**Terminal 1 (Backend - Flask API):**

```powershell
.\backend\.venv\Scripts\python.exe backend\app.py
```
*(Or activate the virtualenv first: `backend\.venv\Scripts\Activate.ps1` followed by `python backend\app.py`)*

The Flask API runs at `http://127.0.0.1:5000`. It creates `backend/skillpath.sqlite3` automatically on startup and seeds the demo account once.

**Terminal 2, project root:**

```powershell
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`. Vite proxies `/api` requests to Flask. Keep both terminals running.

To check the API directly, open `http://127.0.0.1:5000/api/health`. To create a production frontend bundle, run `npm run build`.

## Demo credentials

These are local demonstration credentials, not production credentials:

- Email: `demo@skillpath.local`
- Password: `Demo123!`

The demo profile is inserted only when the database is first created. You can also register your own student account.

## Local security and data

- Passwords are stored as Werkzeug hashes, never as plaintext.
- Session cookies are HTTP-only and use `SameSite=Lax`. `SESSION_COOKIE_SECURE` is disabled for local HTTP development.
- The development secret has a local fallback. Before exposing the server beyond this computer, set a long random `SKILLPATH_SECRET_KEY`, disable debug mode, and configure HTTPS/session cookies appropriately.
- SQLite data lives in `backend/skillpath.sqlite3`; deleting this file resets local accounts and progress. It is ignored by Git.
- This prototype is intended for local development, not public deployment. It does not include CSRF tokens, rate limiting, email verification, or production hardening.

## Project structure

```text
.
├── backend/
│   ├── app.py
│   └── requirements.txt
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```