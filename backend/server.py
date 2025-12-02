from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class Profissional(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id_profissional: str
    nome: str
    status_tratamento: str

class ValidateIDRequest(BaseModel):
    id_profissional: str

class ValidateIDResponse(BaseModel):
    valid: bool
    profissional: Optional[Profissional] = None
    message: str


@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/validate-id", response_model=ValidateIDResponse)
async def validate_id(request: ValidateIDRequest):
    id_prof = request.id_profissional.upper().strip()
    
    profissional = await db.profissionais.find_one(
        {"id_profissional": id_prof},
        {"_id": 0}
    )
    
    if profissional:
        return ValidateIDResponse(
            valid=True,
            profissional=Profissional(**profissional),
            message="ID válida"
        )
    else:
        return ValidateIDResponse(
            valid=False,
            message="ID não encontrada"
        )

@api_router.post("/seed-profissionais")
async def seed_profissionais():
    profissionais = [
        {"id_profissional": "011-K", "nome": "Yasmin Melo", "status_tratamento": "Dra."},
        {"id_profissional": "011-T", "nome": "Anne Evans", "status_tratamento": "Dra."},
        {"id_profissional": "012-T", "nome": "Janete das Graças", "status_tratamento": "Dra."},
        {"id_profissional": "009-V", "nome": "Ana Paula Vieites", "status_tratamento": "Dra."},
        {"id_profissional": "014-N", "nome": "Eliana Priscilla", "status_tratamento": "Dra."},
        {"id_profissional": "016-P", "nome": "Graci Santana", "status_tratamento": "Dra."},
        {"id_profissional": "008-P", "nome": "Julia Moura", "status_tratamento": "Dra."},
        {"id_profissional": "001-B", "nome": "Sâmia Faulin", "status_tratamento": "Dra."},
        {"id_profissional": "020-T", "nome": "Sângely", "status_tratamento": "Dra."}
    ]
    
    await db.profissionais.delete_many({})
    await db.profissionais.insert_many(profissionais)
    
    return {"message": f"{len(profissionais)} profissionais inseridos com sucesso"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()