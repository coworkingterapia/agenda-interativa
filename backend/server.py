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
    valor_original: Optional[float] = 30.0
    credito_utilizado: Optional[float] = 0.0
    forma_pagamento: Optional[str] = None
    status: Optional[str] = "Pendente"
    status_reserva: Optional[str] = "ativo"
    data_cancelamento: Optional[str] = None
    hora_cancelamento: Optional[str] = None
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
    valor_original: Optional[float] = 30.0
    credito_utilizado: Optional[float] = 0.0
    forma_pagamento: Optional[str] = None
    status: Optional[str] = "Pendente"
    status_reserva: Optional[str] = "ativo"
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
        {"id_profissional": "020-T", "nome": "Sângely", "status_tratamento": "Dra."},
        {"id_profissional": "001-Q", "nome": "Evandro Francisco", "status_tratamento": "Dr."},
        {"id_profissional": "000-Y", "nome": "Terapeuta", "status_tratamento": "Dr."},
        {"id_profissional": "100-Y", "nome": "Terapeuta", "status_tratamento": "Dra."}
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
    """
    Cria reservas no MongoDB e sincroniza com Google Calendar
    """
    from datetime import date as dt_date
    
    reservas_criadas = []
    event_ids_criados = []
    
    try:
        import google_calendar
        google_calendar_disponivel = True
    except Exception as e:
        logging.warning(f"Google Calendar não disponível: {e}")
        google_calendar_disponivel = False
    
    hoje = dt_date.today()
    agora = datetime.now(timezone.utc)
    agora_brasilia = agora - timedelta(hours=3)
    
    for reserva_data in request.reservas:
        try:
            data_reserva = dt_date.fromisoformat(reserva_data.data)
            
            if data_reserva < hoje:
                raise HTTPException(
                    status_code=400,
                    detail=f"Data retroativa não permitida: {reserva_data.data}. Não é possível fazer reservas para datas passadas."
                )
            
            if data_reserva == hoje and reserva_data.horario_inicio:
                try:
                    hora, minuto = map(int, reserva_data.horario_inicio.split(':'))
                    horario_reserva_minutos = hora * 60 + minuto
                    horario_atual_minutos = agora_brasilia.hour * 60 + agora_brasilia.minute
                    
                    if horario_reserva_minutos <= horario_atual_minutos:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Horário retroativo não permitido: {reserva_data.horario_inicio}. São {agora_brasilia.strftime('%H:%M')} agora."
                        )
                except ValueError:
                    pass
                    
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Formato de data inválido: {reserva_data.data}"
            )
        
    for reserva_data in request.reservas:
        reserva_obj = Reserva(**reserva_data.model_dump())
        
        if google_calendar_disponivel:
            try:
                resultado_calendar = google_calendar.create_event(
                    id_profissional=reserva_obj.id_profissional,
                    nome_profissional=reserva_obj.nome_profissional,
                    data=reserva_obj.data,
                    horario_inicio=reserva_obj.horario_inicio,
                    horario_fim=reserva_obj.horario_fim,
                    sala=reserva_obj.sala,
                    valor_unitario=reserva_obj.valor_unitario,
                    forma_pagamento=reserva_obj.forma_pagamento
                )
                
                if resultado_calendar['success']:
                    reserva_obj.google_event_id = resultado_calendar['event_id']
                    event_ids_criados.append(resultado_calendar['event_id'])
                    logging.info(f"Evento criado no Google Calendar: {resultado_calendar['event_id']}")
                else:
                    logging.warning(f"Falha ao criar evento no Google Calendar: {resultado_calendar.get('error')}")
            except Exception as e:
                logging.error(f"Erro ao criar evento no Google Calendar: {e}")
        
        doc = reserva_obj.model_dump()
        await db.reservas.insert_one(doc)
        reservas_criadas.append(reserva_obj)
    
    return {
        "message": f"{len(reservas_criadas)} reserva(s) criada(s) com sucesso",
        "count": len(reservas_criadas),
        "google_calendar_synced": len(event_ids_criados),
        "event_ids": event_ids_criados
    }

@api_router.get("/reservas-por-data")
async def get_reservas_por_data(data: str):
    reservas = await db.reservas.find({"data": data}, {"_id": 0}).to_list(1000)
    return reservas

@api_router.post("/seed-reservas")
async def seed_reservas():
    await db.reservas.delete_many({})
    return {"message": "Reservas de teste removidas com sucesso"}

@api_router.post("/reservas/{reserva_id}/desmarcar")
async def desmarcar_reserva(reserva_id: str):
    """
    Desmarca uma reserva (não deleta, apenas desativa) e gera crédito se foi paga
    """
    try:
        reserva = await db.reservas.find_one({"id": reserva_id}, {"_id": 0})
        
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        
        agora = datetime.now(timezone.utc)
        agora_brasilia = agora - timedelta(hours=3)
        data_cancelamento = agora_brasilia.strftime('%d/%m/%Y')
        hora_cancelamento = agora_brasilia.strftime('%H:%M')
        
        credito_gerado = 0.0
        status_pagamento = reserva.get('status', 'Pendente')
        
        if status_pagamento == 'Pago':
            credito_gerado = reserva.get('valor_unitario', 0.0)
            
            profissional = await db.profissionais.find_one(
                {"id_profissional": reserva['id_profissional']},
                {"_id": 0}
            )
            
            if profissional:
                credito_atual = profissional.get('creditos', 0.0)
                novo_credito = credito_atual + credito_gerado
                
                await db.profissionais.update_one(
                    {"id_profissional": reserva['id_profissional']},
                    {"$set": {"creditos": novo_credito}}
                )
        
        google_event_id = reserva.get('google_event_id')
        if google_event_id:
            try:
                import google_calendar
                resultado = google_calendar.delete_event(google_event_id)
                
                if resultado['success']:
                    logging.info(f"Evento deletado do Google Calendar: {google_event_id}")
                else:
                    logging.warning(f"Falha ao deletar evento do Google Calendar: {resultado.get('error')}")
            except Exception as e:
                logging.error(f"Erro ao deletar evento do Google Calendar: {e}")
        
        await db.reservas.update_one(
            {"id": reserva_id},
            {"$set": {
                "status_reserva": "cancelado",
                "data_cancelamento": data_cancelamento,
                "hora_cancelamento": hora_cancelamento
            }}
        )
        
        return {
            "success": True,
            "message": "Reserva desmarcada com sucesso",
            "credito_gerado": credito_gerado,
            "data_cancelamento": data_cancelamento,
            "hora_cancelamento": hora_cancelamento,
            "google_calendar_deleted": bool(google_event_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Erro ao cancelar reserva: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/reservas")
async def delete_all_reservas():
    """
    Remove TODAS as reservas (usar com cuidado!)
    """
    result = await db.reservas.delete_many({})
    return {"message": f"{result.deleted_count} reservas removidas"}


@api_router.post("/calendar/config")
async def configurar_google_calendar(credentials: dict):
    """
    Configura as credenciais do Google Calendar Service Account
    
    Body esperado (JSON completo do Service Account):
    {
        "type": "service_account",
        "project_id": "agendaconsult-481122",
        "private_key_id": "...",
        "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
        "client_email": "agendaconsult-backend@agendaconsult-481122.iam.gserviceaccount.com",
        "client_id": "...",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "...",
        "universe_domain": "googleapis.com"
    }
    """
    try:
        import json
        
        # Validar campos obrigatórios
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        missing_fields = [field for field in required_fields if field not in credentials]
        
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Campos obrigatórios faltando: {', '.join(missing_fields)}"
            )
        
        # Validar tipo
        if credentials.get('type') != 'service_account':
            raise HTTPException(
                status_code=400, 
                detail="Tipo de credencial inválido. Deve ser 'service_account'"
            )
        
        # Validar private_key
        private_key = credentials.get('private_key', '')
        if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
            raise HTTPException(
                status_code=400,
                detail="private_key deve começar com '-----BEGIN PRIVATE KEY-----'"
            )
        
        if not private_key.strip().endswith('-----END PRIVATE KEY-----'):
            raise HTTPException(
                status_code=400,
                detail="private_key deve terminar com '-----END PRIVATE KEY-----'"
            )
        
        # Caminho do arquivo
        credentials_path = os.path.join(
            os.path.dirname(__file__), 
            'agendaconsult-481122-c9b54cd92f0b.json'
        )
        
        # Salvar arquivo com formatação adequada
        with open(credentials_path, 'w', encoding='utf-8') as f:
            json.dump(credentials, f, indent=2, ensure_ascii=False)
        
        # Testar se o arquivo pode ser lido
        try:
            from google.oauth2 import service_account
            test_creds = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            logging.info("Credenciais validadas com sucesso!")
        except Exception as e:
            logging.error(f"Erro ao validar credenciais: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Credenciais inválidas: {str(e)}"
            )
        
        logging.info(f"Google Calendar configurado com sucesso em: {credentials_path}")
        
        return {
            "success": True,
            "message": "Google Calendar configurado com sucesso",
            "path": credentials_path,
            "project_id": credentials.get('project_id'),
            "client_email": credentials.get('client_email'),
            "calendar_id": "coworkingterapia@gmail.com"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Erro ao configurar Google Calendar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calendar/criar-evento")
async def criar_evento_calendar(dados: dict):
    """
    Cria um evento no Google Calendar
    
    Body esperado:
    {
        "id_profissional": "011-K",
        "nome_profissional": "Dra. Yasmin Melo",
        "data": "2025-12-15",
        "horario_inicio": "10:00",
        "horario_fim": "11:15",
        "sala": "03",
        "valor_unitario": 38.0,
        "forma_pagamento": "antecipado"
    }
    """
    try:
        from services.google_calendar_service import criar_evento_calendar as criar_evento
        
        resultado = criar_evento(dados)
        
        if resultado['success']:
            return {
                "success": True,
                "event_id": resultado['event_id'],
                "link": resultado['link'],
                "message": resultado['message']
            }
        else:
            raise HTTPException(status_code=500, detail=resultado['message'])
            
    except ImportError as e:
        logging.error(f"Erro ao importar serviço do Google Calendar: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Serviço do Google Calendar não disponível. Verifique as credenciais."
        )
    except Exception as e:
        logging.error(f"Erro ao criar evento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calendar/criar-multiplos-eventos")
async def criar_multiplos_eventos_calendar(dados: dict):
    """
    Cria múltiplos eventos no Google Calendar (para agendamentos recorrentes)
    
    Body esperado:
    {
        "agendamentos": [
            {
                "id_profissional": "011-K",
                "nome_profissional": "Dra. Yasmin Melo",
                "data": "2025-12-15",
                "horario_inicio": "10:00",
                "horario_fim": "11:15",
                "sala": "03",
                "valor_unitario": 38.0,
                "forma_pagamento": "antecipado"
            }
        ]
    }
    """
    try:
        from services.google_calendar_service import criar_multiplos_eventos
        
        agendamentos = dados.get('agendamentos', [])
        
        if not agendamentos:
            raise HTTPException(status_code=400, detail="Lista de agendamentos vazia")
        
        resultado = criar_multiplos_eventos(agendamentos)
        
        return {
            "success": resultado['success'],
            "total_criados": resultado['total_criados'],
            "total_erros": resultado['total_erros'],
            "eventos": resultado['eventos_criados'],
            "erros": resultado['erros']
        }
            
    except ImportError as e:
        logging.error(f"Erro ao importar serviço do Google Calendar: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Serviço do Google Calendar não disponível. Verifique as credenciais."
        )
    except Exception as e:
        logging.error(f"Erro ao criar eventos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/google/auth/login")
async def google_login(email: str):
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
    
    if not client_id or not redirect_uri:
        raise HTTPException(status_code=500, detail="Google credentials not configured")
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=https://www.googleapis.com/auth/calendar&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={email}"
    )
    
    return {"authorization_url": auth_url}


@api_router.get("/google/auth/callback")
async def google_callback(code: str, state: str):
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
    
    try:
        token_resp = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }).json()
        
        if 'error' in token_resp:
            raise HTTPException(status_code=400, detail=token_resp['error'])
        
        user_email = state
        
        await db.google_tokens.update_one(
            {"email": user_email},
            {"$set": {"tokens": token_resp, "updated_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        
        return RedirectResponse(url=f"/?google_auth=success&email={user_email}")
    
    except Exception as e:
        logging.error(f"Google OAuth error: {str(e)}")
        return RedirectResponse(url="/?google_auth=error")


async def get_google_credentials(email: str):
    token_doc = await db.google_tokens.find_one({"email": email})
    
    if not token_doc:
        return None
    
    tokens = token_doc['tokens']
    
    creds = Credentials(
        token=tokens['access_token'],
        refresh_token=tokens.get('refresh_token'),
        token_uri='https://oauth2.googleapis.com/token',
        client_id=os.environ.get('GOOGLE_CLIENT_ID'),
        client_secret=os.environ.get('GOOGLE_CLIENT_SECRET')
    )
    
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        await db.google_tokens.update_one(
            {"email": email},
            {"$set": {"tokens.access_token": creds.token}}
        )
    
    return creds


@api_router.post("/google/calendar/create-event")
async def create_calendar_event(email: str, event_data: dict):
    try:
        creds = await get_google_credentials(email)
        
        if not creds:
            raise HTTPException(status_code=401, detail="User not authenticated with Google")
        
        service = build('calendar', 'v3', credentials=creds)
        
        event = service.events().insert(
            calendarId='primary',
            body=event_data
        ).execute()
        
        return {"event_id": event['id'], "link": event.get('htmlLink')}
    
    except Exception as e:
        logging.error(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/google/calendar/sync-reservations")
async def sync_reservations_to_calendar(email: str, reservations: List[dict]):
    try:
        creds = await get_google_credentials(email)
        
        if not creds:
            return {"success": False, "message": "Not authenticated", "synced": 0}
        
        service = build('calendar', 'v3', credentials=creds)
        synced_count = 0
        event_ids = []
        
        for reserva in reservations:
            try:
                start_datetime = f"{reserva['data']}T{reserva['horario_inicio']}:00"
                end_datetime = f"{reserva['data']}T{reserva['horario_fim']}:00"
                
                event_body = {
                    'summary': f"Consulta - {reserva['nome_profissional']} - ID {reserva['id_profissional']}",
                    'description': f"Sala: {reserva['sala']} | Valor: R$ {reserva['valor_unitario']:.2f} | Pagamento: {reserva['forma_pagamento']}",
                    'start': {
                        'dateTime': start_datetime,
                        'timeZone': 'America/Sao_Paulo'
                    },
                    'end': {
                        'dateTime': end_datetime,
                        'timeZone': 'America/Sao_Paulo'
                    },
                    'reminders': {
                        'useDefault': False,
                        'overrides': [
                            {'method': 'email', 'minutes': 24 * 60},
                            {'method': 'popup', 'minutes': 15}
                        ]
                    }
                }
                
                event = service.events().insert(calendarId='primary', body=event_body).execute()
                event_ids.append(event['id'])
                synced_count += 1
                
            except Exception as e:
                logging.error(f"Error syncing individual reservation: {str(e)}")
                continue
        
        return {
            "success": True,
            "synced": synced_count,
            "total": len(reservations),
            "event_ids": event_ids
        }
    
    except Exception as e:
        logging.error(f"Error syncing reservations: {str(e)}")
        return {"success": False, "message": str(e), "synced": 0}


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