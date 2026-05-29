from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.models import *  # noqa: F401, F403
from app.routes import auth, transactions, categories, accounts, dashboard, ai, reports, saving_goals
from app.middleware.error_handler import register_error_handlers

app = FastAPI(
    title="Gerenciador de Gastos com IA",
    version="1.0.0",
    debug=settings.PYTHON_ENV == "development",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(accounts.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(saving_goals.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Gerenciador de Gastos com IA - API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
