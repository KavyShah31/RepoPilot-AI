# 🚀 RepoPilot-AI

### AI-Powered GitHub Repository Analysis & Code Intelligence Platform

RepoPilot-AI is an AI-powered repository analysis platform designed to help developers understand, analyze, and improve their GitHub repositories.

It provides code intelligence, code quality analysis, AI-powered code reviews, security analysis, repository comparison, recommendations, and repository health analytics through a modern web dashboard.

---

## ✨ Features

### 1. Repository Analysis

- Analyze public GitHub repositories.
- Retrieve repository information.
- Explore repository structure and programming languages.

### 2. Code Intelligence

- Analyze source code.
- Understand code structure.
- Explore code-related insights.

### 3. Code Quality Analysis

- Identify potential code quality issues.
- Analyze code quality metrics.
- Highlight areas that need improvement.

### 4. AI Code Review

- Review repository code.
- Identify potential improvements.
- Generate code review insights.

### 5. Security Analysis

- Detect potential security issues.
- Identify security risks.
- Display security analysis results.

### 6. Repository History

- Store previous analysis results.
- View repository scan history.
- Retrieve individual scan records.

### 7. Repository Comparison

- Compare two GitHub repositories.
- Review repository differences and analysis results.

### 8. AI-Powered Recommendations

- Prioritize detected issues.
- Display risk scores and severity.
- Provide suggested fixes and improvement guidance.

### 9. Repository Health & Analytics

- Calculate repository health scores.
- Generate health grades.
- Analyze quality and security risks.
- Track repository trends and historical scores.

---

## 🛠️ Technology Stack

| Category           | Technologies                  |
| ------------------ | ----------------------------- |
| Frontend           | React.js, Vite, JavaScript    |
| Backend            | Python, FastAPI               |
| API Communication  | Axios, REST API               |
| Database           | SQLite                        |
| Data Visualization | Recharts                      |
| UI Icons           | Lucide React                  |
| Testing - Backend  | Pytest, HTTPX                 |
| Testing - Frontend | Vitest, React Testing Library |
| Version Control    | Git, GitHub                   |

---

## 🏗️ Project Architecture

```text
RepoPilot-AI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── requirements-render.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── test/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── tests/
├── data/
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

Install the following tools:

- Python 3.11+
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/KavyShah31/RepoPilot-AI.git
cd RepoPilot-AI
```

### 2. Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
python -m pip install -r backend/requirements.txt
```

Start the FastAPI server from the project root:

```bash
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create a `.env.development` file inside the frontend folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 🧪 Testing

### Backend Tests

Run from the project root:

```powershell
python -m pytest -q
```

### Frontend Tests

Run from the frontend directory:

```powershell
npm run test:run
```

### Production Build

```powershell
npm run build
```

---

## 🔌 API Endpoints

| Method | Endpoint                                 | Description             |
| ------ | ---------------------------------------- | ----------------------- |
| GET    | `/`                                      | Application information |
| GET    | `/health`                                | Backend health check    |
| POST   | `/api/v1/repositories/analyze`           | Repository analysis     |
| POST   | `/api/v1/repositories/code-analysis`     | Code intelligence       |
| POST   | `/api/v1/repositories/quality-analysis`  | Code quality analysis   |
| POST   | `/api/v1/repositories/ai-review`         | AI code review          |
| POST   | `/api/v1/repositories/security-analysis` | Security analysis       |
| GET    | `/api/v1/history/`                       | Analysis history        |
| POST   | `/api/v1/repositories/compare`           | Repository comparison   |
| POST   | `/api/v1/repositories/recommendations`   | Recommendations         |
| POST   | `/api/v1/repositories/health`            | Repository health       |
| POST   | `/api/v1/repositories/health/trends`     | Health trends           |

For request and response schemas, visit `/docs` while the backend is running.

---

## 🎯 Project Goals

- Make GitHub repository analysis easier.
- Help developers identify code quality issues.
- Improve awareness of potential security risks.
- Provide actionable recommendations.
- Visualize repository health and development insights.

---

## 🗺️ Development Progress

- [x] Milestone 1 – Project Setup & Architecture
- [x] Milestone 2 – FastAPI Backend Foundation
- [x] Milestone 3 – GitHub Repository Analyzer
- [x] Milestone 4 – React + Backend Integration
- [x] Milestone 5 – Dashboard & Results UI
- [x] Milestone 6 – Code Intelligence
- [x] Milestone 7 – Code Quality Analysis
- [x] Milestone 8 – AI Code Review
- [x] Milestone 9 – Security Analysis
- [x] Milestone 10 – Repository History
- [x] Milestone 11 – Advanced Repository Comparison
- [x] Milestone 12 – AI-Powered Recommendations
- [x] Milestone 13 – Repository Health & Analytics
- [x] Milestone 14 – Testing & Optimization
- [ ] Milestone 15 – Deployment & Portfolio Release

---

## 👨‍💻 Developer

**Kavy Shah**

GitHub: [@KavyShah31](https://github.com/KavyShah31)

Project Repository: [RepoPilot-AI](https://github.com/KavyShah31/RepoPilot-AI)

---

## 📄 License

This project is currently developed as a personal portfolio project. Licensing terms can be added when a license is selected.
