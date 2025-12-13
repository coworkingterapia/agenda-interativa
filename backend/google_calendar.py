from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'agendaconsult-481122-c9b54cd92f0b.json')
CALENDAR_ID = 'coworkingterapia@gmail.com'


def get_calendar_service():
    """
    Cria e retorna o serviço do Google Calendar autenticado
    
    Returns:
        service: Serviço do Google Calendar autenticado
    """
    try:
        if not os.path.exists(SERVICE_ACCOUNT_FILE):
            logger.error(f"Arquivo de credenciais não encontrado: {SERVICE_ACCOUNT_FILE}")
            raise FileNotFoundError(f"Credenciais do Google Calendar não configuradas. Use POST /api/calendar/config")
        
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, 
            scopes=SCOPES
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        logger.info("Serviço do Google Calendar criado com sucesso")
        return service
        
    except Exception as e:
        logger.error(f"Erro ao criar serviço do Google Calendar: {e}")
        raise


def create_event(id_profissional, nome_profissional, data, horario_inicio, horario_fim, 
                 sala, valor_unitario, forma_pagamento, resumo_adicional=None):
    """
    Cria um evento no Google Calendar
    
    Args:
        id_profissional (str): ID do profissional (ex: "011-K")
        nome_profissional (str): Nome completo do profissional
        data (str): Data no formato YYYY-MM-DD
        horario_inicio (str): Horário de início no formato HH:MM
        horario_fim (str): Horário de fim no formato HH:MM
        sala (str): Número da sala
        valor_unitario (float): Valor do agendamento
        forma_pagamento (str): Forma de pagamento ("antecipado" ou "no-dia")
        resumo_adicional (str, optional): Informações adicionais para a descrição
    
    Returns:
        dict: {
            "success": True/False,
            "event_id": "id_do_evento" (se sucesso),
            "event_link": "link_do_evento" (se sucesso),
            "error": "mensagem_de_erro" (se falha)
        }
    """
    try:
        service = get_calendar_service()
        
        # Montar data/hora no formato RFC3339
        data_hora_inicio = f"{data}T{horario_inicio}:00"
        data_hora_fim = f"{data}T{horario_fim}:00"
        
        # Criar descrição do evento
        descricao_linhas = [
            "=== AGENDAMENTO CONFIRMADO ===",
            "",
            f"ID Profissional: {id_profissional}",
            f"Nome: {nome_profissional}",
            f"Sala: {sala}",
            f"Valor: R$ {valor_unitario:.2f}",
            f"Forma de pagamento: {forma_pagamento}",
        ]
        
        if resumo_adicional:
            descricao_linhas.append("")
            descricao_linhas.append(resumo_adicional)
        
        descricao = "\n".join(descricao_linhas)
        
        # Criar o evento
        evento = {
            'summary': f'Agendamento - {id_profissional}',
            'description': descricao,
            'start': {
                'dateTime': data_hora_inicio,
                'timeZone': 'America/Sao_Paulo',
            },
            'end': {
                'dateTime': data_hora_fim,
                'timeZone': 'America/Sao_Paulo',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 24 horas antes
                    {'method': 'popup', 'minutes': 15},       # 15 minutos antes
                ],
            },
            'colorId': '9',  # Azul (pode ser customizado)
        }
        
        # Inserir o evento no calendário
        evento_criado = service.events().insert(
            calendarId=CALENDAR_ID, 
            body=evento
        ).execute()
        
        event_id = evento_criado.get('id')
        event_link = evento_criado.get('htmlLink')
        
        logger.info(f"Evento criado com sucesso no Google Calendar: {event_id}")
        
        return {
            "success": True,
            "event_id": event_id,
            "event_link": event_link,
            "message": "Evento criado no Google Calendar com sucesso"
        }
        
    except HttpError as e:
        logger.error(f"Erro HTTP ao criar evento no Google Calendar: {e}")
        return {
            "success": False,
            "error": f"Erro HTTP: {e.status_code} - {e.error_details}",
            "message": "Erro ao criar evento no Google Calendar"
        }
    except Exception as e:
        logger.error(f"Erro ao criar evento no Google Calendar: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erro ao criar evento no Google Calendar"
        }


def delete_event(event_id):
    """
    Deleta um evento do Google Calendar
    
    Args:
        event_id (str): ID do evento no Google Calendar
    
    Returns:
        dict: {
            "success": True/False,
            "message": "mensagem",
            "error": "mensagem_de_erro" (se falha)
        }
    """
    try:
        service = get_calendar_service()
        
        # Deletar o evento
        service.events().delete(
            calendarId=CALENDAR_ID,
            eventId=event_id
        ).execute()
        
        logger.info(f"Evento deletado do Google Calendar: {event_id}")
        
        return {
            "success": True,
            "message": f"Evento {event_id} deletado com sucesso do Google Calendar"
        }
        
    except HttpError as e:
        if e.status_code == 404:
            logger.warning(f"Evento não encontrado no Google Calendar: {event_id}")
            return {
                "success": False,
                "error": "Evento não encontrado no Google Calendar",
                "message": "O evento pode já ter sido deletado"
            }
        else:
            logger.error(f"Erro HTTP ao deletar evento: {e}")
            return {
                "success": False,
                "error": f"Erro HTTP: {e.status_code} - {e.error_details}",
                "message": "Erro ao deletar evento do Google Calendar"
            }
    except Exception as e:
        logger.error(f"Erro ao deletar evento do Google Calendar: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erro ao deletar evento do Google Calendar"
        }


def create_multiple_events(agendamentos):
    """
    Cria múltiplos eventos no Google Calendar (para agendamentos recorrentes)
    
    Args:
        agendamentos (list): Lista de dicionários com dados dos agendamentos
            Cada item deve ter: id_profissional, nome_profissional, data, 
            horario_inicio, horario_fim, sala, valor_unitario, forma_pagamento
    
    Returns:
        dict: {
            "success": True/False,
            "eventos_criados": [...],  # Lista de event_ids criados
            "total_criados": int,
            "total_erros": int,
            "erros": [...]  # Lista de erros
        }
    """
    resultados = {
        "success": True,
        "eventos_criados": [],
        "erros": [],
        "total_criados": 0,
        "total_erros": 0
    }
    
    for agendamento in agendamentos:
        try:
            resultado = create_event(
                id_profissional=agendamento.get('id_profissional'),
                nome_profissional=agendamento.get('nome_profissional'),
                data=agendamento.get('data'),
                horario_inicio=agendamento.get('horario_inicio'),
                horario_fim=agendamento.get('horario_fim'),
                sala=agendamento.get('sala'),
                valor_unitario=agendamento.get('valor_unitario', 0),
                forma_pagamento=agendamento.get('forma_pagamento', 'N/A'),
                resumo_adicional=agendamento.get('resumo_adicional')
            )
            
            if resultado['success']:
                resultados['eventos_criados'].append({
                    'event_id': resultado['event_id'],
                    'event_link': resultado['event_link'],
                    'data': agendamento.get('data'),
                    'horario': agendamento.get('horario_inicio')
                })
                resultados['total_criados'] += 1
            else:
                resultados['erros'].append({
                    'data': agendamento.get('data'),
                    'horario': agendamento.get('horario_inicio'),
                    'erro': resultado.get('error', 'Erro desconhecido')
                })
                resultados['total_erros'] += 1
                resultados['success'] = False
                
        except Exception as e:
            logger.error(f"Erro ao processar agendamento: {e}")
            resultados['erros'].append({
                'data': agendamento.get('data'),
                'erro': str(e)
            })
            resultados['total_erros'] += 1
            resultados['success'] = False
    
    return resultados


def delete_multiple_events(event_ids):
    """
    Deleta múltiplos eventos do Google Calendar
    
    Args:
        event_ids (list): Lista de IDs de eventos
    
    Returns:
        dict: {
            "success": True/False,
            "total_deletados": int,
            "total_erros": int,
            "erros": [...]
        }
    """
    resultados = {
        "success": True,
        "total_deletados": 0,
        "total_erros": 0,
        "erros": []
    }
    
    for event_id in event_ids:
        resultado = delete_event(event_id)
        
        if resultado['success']:
            resultados['total_deletados'] += 1
        else:
            resultados['total_erros'] += 1
            resultados['erros'].append({
                'event_id': event_id,
                'erro': resultado.get('error', 'Erro desconhecido')
            })
            resultados['success'] = False
    
    return resultados
