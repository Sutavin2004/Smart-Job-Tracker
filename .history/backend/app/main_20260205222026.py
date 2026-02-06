from fastapi import FastAPI
from app.core.config import settings
from app.db.database import init_db

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
    )

    @app.on_event("startup")
    async def startup_event():
        init_db()

    @app.on_event("shutdown")
    async def shutdown_event():
        pass

    return app

app = create_app()
