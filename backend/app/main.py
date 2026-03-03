from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import auth as auth_routes
from .routes import tasks as task_routes


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskConnect API",
    description="API for the TaskConnect task-sharing platform.",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://signature-breakdown-significantly-interesting.trycloudflare.com"
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(task_routes.router, prefix="/api/tasks", tags=["tasks"])


@app.get("/api/health")
def read_health():
    return {"status": "ok", "service": "TaskConnect API"}

