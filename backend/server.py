from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest


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

class Reserva(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: str
    sala: str
    horario: str
    duracao_minutos: int = 60
    id_profissional: Optional[str] = None
    nome_profissional: Optional[str] = None
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    acrescimo_minutos: Optional[int] = 0
    valor_unitario: Optional[float] = 30.0
    forma_pagamento: Optional[str] = None
    status: Optional[str] = "Pendente"
    google_event_id: Optional[str] = None

class ReservaCreate(BaseModel):
    data: str
    sala: str
    horario: str
    duracao_minutos: int = 60
    id_profissional: Optional[str] = None
    nome_profissional: Optional[str] = None
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    acrescimo_minutos: Optional[int] = 0
    valor_unitario: Optional[float] = 30.0
    forma_pagamento: Optional[str] = None
    status: Optional[str] = "Pendente"
    google_event_id: Optional[str] = None

class ReservasCreateRequest(BaseModel):
    reservas: List[ReservaCreate]


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

@api_router.get("/reservas")
async def get_reservas(mes: Optional[str] = None, ano: Optional[str] = None):
    query = {}
    if mes and ano:
        query = {
            "$expr": {
                "$and": [
                    {"$eq": [{"$month": {"$dateFromString": {"dateString": "$data"}}}, int(mes)]},
                    {"$eq": [{"$year": {"$dateFromString": {"dateString": "$data"}}}, int(ano)]}
                ]
            }
        }
    
    reservas = await db.reservas.find(query, {"_id": 0}).to_list(1000)
    return reservas

@api_router.post("/reservas")
async def create_reservas(request: ReservasCreateRequest):
    reservas_criadas = []
    
    for reserva_data in request.reservas:
        reserva_obj = Reserva(**reserva_data.model_dump())
        doc = reserva_obj.model_dump()
        await db.reservas.insert_one(doc)
        reservas_criadas.append(reserva_obj)
    
    return {
        "message": f"{len(reservas_criadas)} reserva(s) criada(s) com sucesso",
        "count": len(reservas_criadas)
    }

@api_router.get("/reservas-por-data")
async def get_reservas_por_data(data: str):
    reservas = await db.reservas.find({"data": data}, {"_id": 0}).to_list(1000)
    return reservas

@api_router.post("/seed-reservas")
async def seed_reservas():
    await db.reservas.delete_many({})
    return {"message": "Reservas de teste removidas com sucesso"}

@api_router.delete("/reservas")
async def delete_all_reservas():
    result = await db.reservas.delete_many({})
    return {"message": f"{result.deleted_count} reservas removidas"}


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