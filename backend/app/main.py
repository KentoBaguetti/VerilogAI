import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Set all CORS enabled origins
# Using a permissive list for local development to fix potential configuration issues
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://34.83.37.61",
    "http://34.83.37.61:5173",
    "http://34.83.37.61:8000",
    "https://34.83.37.61",
    "https://34.83.37.61:5173",
]

# Extend with settings origins if they exist and are not already included
if settings.all_cors_origins:
    for origin in settings.all_cors_origins:
        if origin not in origins:
            origins.append(origin)

# Configure CORS middleware
# For production/staging, allow all origins (but without credentials)
# For local or when GCP origins are detected, use specific origins with credentials
if settings.ENVIRONMENT == "production" or settings.ENVIRONMENT == "staging":
    # Production: allow all origins but without credentials (CORS limitation)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Cannot use credentials with wildcard origins
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Local or GCP with known origins: use specific origins with credentials
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
