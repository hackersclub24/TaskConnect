from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import auth as auth_routes
from .routes import tasks as task_routes
from .routes import users as user_routes
from .routes import reviews as review_routes
from .routes import contact as contact_routes
from .routes import chat as chat_routes
from .routes import platform_reviews as platform_reviews_routes


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Skillstreet API",
    description="API for the Skillstreet task-sharing platform.",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://signature-breakdown-significantly-interesting.trycloudflare.com",
    "https://skillstreet-nmtosuvo3-hackersclub24s-projects.vercel.app",
    
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
app.include_router(user_routes.router, prefix="/api/users", tags=["users"])
app.include_router(review_routes.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(contact_routes.router, prefix="/api/contact", tags=["contact"])
app.include_router(chat_routes.router, prefix="/ws", tags=["chat"])
app.include_router(platform_reviews_routes.router, prefix="/api/platform-reviews", tags=["platform-reviews"])


@app.get("/api/health")
def read_health():
    return {"status": "ok", "service": "Skillstreet API"}

