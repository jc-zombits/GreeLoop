from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .items import router as items_router
from .exchanges import router as exchanges_router
from .categories import router as categories_router
from .notifications import router as notifications_router
from .ratings import router as ratings_router
from .messages import router as messages_router
from .community import router as community_router
from .company_auth import router as company_auth_router
from .contributions import router as contributions_router
from .stats import router as stats_router

api_router = APIRouter()

# Incluir todos los routers con sus prefijos
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    items_router,
    prefix="/items",
    tags=["items"]
)

api_router.include_router(
    exchanges_router,
    prefix="/exchanges",
    tags=["exchanges"]
)

api_router.include_router(
    categories_router,
    prefix="/categories",
    tags=["categories"]
)

api_router.include_router(
    notifications_router,
    prefix="/notifications",
    tags=["notifications"]
)

api_router.include_router(
    ratings_router,
    prefix="/ratings",
    tags=["ratings"]
)

api_router.include_router(
    messages_router,
    prefix="/messages",
    tags=["messages"]
)

api_router.include_router(
    community_router,
    prefix="/community",
    tags=["community"]
)

api_router.include_router(
    company_auth_router,
    prefix="/company-auth",
    tags=["company-authentication"]
)

api_router.include_router(
    contributions_router,
    prefix="/contributions",
    tags=["contributions"]
)

api_router.include_router(
    stats_router,
    prefix="/stats",
    tags=["statistics"]
)