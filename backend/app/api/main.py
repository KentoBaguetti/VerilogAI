from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils
from app.api.routes.generate import router as generate_router
from app.api.routes.simulate import router as simulate_router
from app.api.routes.lint import router as lint_router
from app.api.routes.tb import router as tb_router  # noqa: F401
from app.api.routes.chat import router as chat_router
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(generate_router)
api_router.include_router(simulate_router)
api_router.include_router(lint_router)
api_router.include_router(tb_router)
api_router.include_router(chat_router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
