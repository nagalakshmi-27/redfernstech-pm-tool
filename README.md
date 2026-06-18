# RedFlow Project Management Tool

RedFlow is a full-stack, production-ready Project Management application designed to help teams track tasks, manage project schedules, and collaborate efficiently.

## Features
- **Project & Task Tracking:** Create projects, assign team members, and track individual task deadlines.
- **Dynamic Calendar:** Automatically syncs project deadlines and allows users to create personal manual events (Meetings, Sprints, etc.).
- **Automated Notifications:** Secure backend triggers alert project creators when assignees update the status of their tasks.
- **Role-Based Access Control:** Strict permission modeling ensuring assignees can only update task statuses, while creators maintain full control.
- **Secure Authentication:** JWT-based user authentication and password hashing.

## Technology Stack
- **Frontend:** React.js, Vite, TailwindCSS, Lucide React (Icons)
- **Backend:** Python, FastAPI, SQLAlchemy (ORM), Alembic (Migrations)
- **Database:** PostgreSQL (Production) / SQLite (Local Development fallback)

---

## Local Development Setup

Follow these steps to run the application locally on your machine.

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd redflow-backend
```

Create and activate a virtual environment (Windows):
```bash
python -m venv venv
.\venv\Scripts\activate
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Set up your Environment Variables:
Create a `.env` file in the `redflow-backend` folder with the following variables:
```env
# Example Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/redflow
SECRET_KEY=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
```

Run Database Migrations (to build your tables):
```bash
alembic upgrade head
```

Start the Backend Server:
```bash
uvicorn main:app --reload
```
*The backend API will now be running at `http://127.0.0.1:8000`*

---

### 2. Frontend Setup

Open a **new, separate** terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install the Node.js dependencies:
```bash
npm install
```

Set up your Environment Variables:
Create a `.env` file in the `frontend` folder to point the React app to your backend:
```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the Frontend Development Server:
```bash
npm run dev
```
*The React app will now be running at `http://localhost:5173`*

---
