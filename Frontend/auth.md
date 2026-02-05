/config/settings.py

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    CLERK_ISSUER = os.getenv("CLERK_ISSUER")
    CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

settings = Settings()


/core/auth.py

from fastapi import Header, HTTPException
from jose import jwt
import requests
from app.config.settings import settings

JWKS_URL = f"{settings.CLERK_ISSUER}/.well-known/jwks.json"
JWKS = requests.get(JWKS_URL).json()

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(
            token,
            JWKS,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},
        )
        return payload["sub"]  # clerk_user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

/db/supabase.py
from supabase import create_client
from app.config.settings import settings

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY
)

/routes/__init__.py
from app.routes.users import router as users_router

routers = [
    users_router
]

users/users.py
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db.supabase import supabase

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/init")
def init_user(clerk_user_id: str = Depends(get_current_user)):
    supabase.table("users").upsert(
        {
            "clerk_user_id": clerk_user_id
        },
        on_conflict="clerk_user_id"
    ).execute()

    return {"status": "ok"}


schemas/user.py
from pydantic import BaseModel

class UserInitResponse(BaseModel):
    status: str

main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import routers

app = FastAPI(title="Vyapaar AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  
    ],
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],        
)

for router in routers:
    app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok"}
