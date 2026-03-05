## Skillstreet

Skillstreet is a full‑stack task‑sharing platform. Users can register, log in, create tasks they need help with, browse tasks, and accept tasks created by others.

Backend is built with **FastAPI + PostgreSQL + SQLAlchemy + JWT**, and frontend is built with **React (Vite) + Tailwind CSS + React Router + Axios**.

---

### 1. Project Structure

- **backend** – FastAPI app
  - `app/main.py` – FastAPI application entrypoint (CORS + routes + Swagger)
  - `app/database.py` – SQLAlchemy engine, session and Base
  - `app/models.py` – `User` and `Task` ORM models
  - `app/schemas.py` – Pydantic models (users, tasks, JWT)
  - `app/auth.py` – auth helpers and `get_current_user` dependency
  - `app/routes/auth.py` – registration and login routes
  - `app/routes/tasks.py` – CRUD/task‑related routes
  - `app/core/security.py` – password hashing and JWT helpers
  - `.env` / `.env.template` – environment configuration
  - `requirements.txt` – Python dependencies

- **frontend** – React SPA
  - `src/main.jsx` – React root with `BrowserRouter`
  - `src/App.jsx` – routes + `PrivateRoute` wrapper
  - `src/pages/*.jsx` – `Login`, `Register`, `Dashboard`, `CreateTask`, `TaskDetails`
  - `src/components/*.jsx` – `Navbar`, `TaskCard`
  - `src/services/api.js` – Axios instance and API helpers
  - `tailwind.config.js`, `postcss.config.js`, `src/index.css` – Tailwind (dark UI)

---

### 2. Backend – Setup & Run

#### 2.1. Create and configure `.env`

From the `backend` folder, copy the template and adjust values:

```bash
cd backend
copy .env.template .env   # (Windows PowerShell: Copy-Item .env.template .env)
```

Edit `.env`:

- **DATABASE_URL** – PostgreSQL connection string, e.g.  
  `postgresql+psycopg2://postgres:yourpassword@localhost:5432/taskconnect`
- **SECRET_KEY** – a long random string
- **ALGORITHM** – usually `HS256`
- **ACCESS_TOKEN_EXPIRE_MINUTES** – e.g. `60`

Create the database `taskconnect` in PostgreSQL (or change the DB name in `DATABASE_URL`).

#### 2.2. Install dependencies

From `backend`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

#### 2.3. Run backend server

From `backend`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`, with Swagger docs at `http://localhost:8000/docs`.

---

### 3. Frontend – Setup & Run

#### 3.1. Install Node dependencies

From the `frontend` folder:

```bash
cd ../frontend
npm install
```

*(Optional)* Create a `.env` file in `frontend` if you want to override API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

By default, the frontend uses `http://localhost:8000/api`.

#### 3.2. Run Vite dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 4. API Overview

- **Auth**
  - `POST /api/auth/register` – register user  
    Body: `{ "email": "user@example.com", "password": "secret" }`
  - `POST /api/auth/login` – login and get JWT  
    Body: `{ "email": "user@example.com", "password": "secret" }`  
    Response: `{ "access_token": "...", "token_type": "bearer" }`

- **Tasks**
  - `GET /api/tasks/` – list all tasks (public)
  - `GET /api/tasks/{id}` – get single task
  - `POST /api/tasks/` – create task (JWT required)  
    Body: `{ "title", "description", "deadline" (ISO or null), "reward" }`
  - `POST /api/tasks/{id}/accept` – accept task (JWT required)

To call protected routes, send header:

```text
Authorization: Bearer <access_token>
```

---

### 5. Frontend Behavior

- **JWT storage**: Login stores `access_token` in `localStorage` under key `token`.
- **Protected routes**: `Dashboard`, `CreateTask`, `TaskDetails` are wrapped in `PrivateRoute` and redirect to `/login` when not authenticated.
- **Axios**: `src/services/api.js` attaches the token to `Authorization` header automatically.
- **UI**:
  - Modern dark theme with Tailwind.
  - `Dashboard` lists all tasks with `TaskCard` components.
  - `CreateTask` allows creating a new task (authenticated).
  - `TaskDetails` shows full info and allows accepting an open task.

---

### 6. Running Everything Together

1. **Start PostgreSQL** and ensure your database (e.g. `taskconnect`) exists.
2. **Backend**  
   - `cd backend`  
   - Create and configure `.env` (see 2.1).  
   - `python -m venv .venv && .venv\Scripts\activate`  
   - `pip install -r requirements.txt`  
   - `uvicorn app.main:app --reload --port 8000`
3. **Frontend**  
   - `cd ../frontend`  
   - `npm install`  
   - `npm run dev`  
   - Open `http://localhost:5173`

You now have **Skillstreet** running locally with backend and frontend operating independently but connected via the REST API.

