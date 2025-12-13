from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os
import logging

SCOPES = ['https://www.googleapis.com/auth/calendar']
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), '..', 'agendaconsult-481122-c9b54cd92f0b.json')
CALENDAR_ID = 'coworkingterapia@gmail.com'

logger = logging.getLogger(__name__)


def get_calendar_service():
    """Cria e retorna o serviço do Google Calendar autenticado"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, 
            scopes=SCOPES
        )
        service = build('calendar', 'v3', credentials=credentials)
        return service
    except Exception as e:
        logger.error(f"Erro ao criar serviço do Google Calendar: {e}")
        raise


def criar_evento_calendar(dados_agendamento):
    """
    Cria um evento no Google Calendar
    
    Args:
        dados_agendamento (dict): Dicionário com os dados do agendamento
            - id_profissional (str): ID do profissional
            - nome_profissional (str): Nome completo do profissional
            - data (str): Data no formato YYYY-MM-DD
            - horario_inicio (str): Horário de início (HH:MM)
            - horario_fim (str): Horário de fim (HH:MM)
            - sala (str): Número da sala
            - valor_unitario (float): Valor do agendamento
            - forma_pagamento (str): Forma de pagamento
    
    Returns:
        dict: Dicionário com event_id e link do evento
    """
    try:
        service = get_calendar_service()
        
        data = dados_agendamento.get('data')
        horario_inicio = dados_agendamento.get('horario_inicio')
        horario_fim = dados_agendamento.get('horario_fim')
        
        data_hora_inicio = f"{data}T{horario_inicio}:00"
        data_hora_fim = f"{data}T{horario_fim}:00"
        
        id_profissional = dados_agendamento.get('id_profissional', 'N/A')
        nome_profissional = dados_agendamento.get('nome_profissional', 'N/A')
        sala = dados_agendamento.get('sala', 'N/A')
        valor = dados_agendamento.get('valor_unitario', 0)
        pagamento = dados_agendamento.get('forma_pagamento', 'N/A')
        
        descricao = f"""Agendamento confirmado
        
ID Profissional: {id_profissional}
Nome: {nome_profissional}
Sala: {sala}
Valor: R$ {valor:.2f}
Forma de pagamento: {pagamento}
"""
        
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
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 15},
                ],
            },
        }
        
        evento_criado = service.events().insert(
            calendarId=CALENDAR_ID, 
            body=evento
        ).execute()
        
        logger.info(f"Evento criado com sucesso: {evento_criado.get('id')}")
        
        return {
            'success': True,
            'event_id': evento_criado.get('id'),
            'link': evento_criado.get('htmlLink'),
            'message': 'Evento criado no Google Calendar com sucesso'
        }
        
    except Exception as e:
        logger.error(f"Erro ao criar evento no Google Calendar: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Erro ao criar evento no Google Calendar'
        }


def criar_multiplos_eventos(lista_agendamentos):
    """
    Cria múltiplos eventos no Google Calendar (para agendamentos recorrentes)
    
    Args:
        lista_agendamentos (list): Lista de dicionários com dados dos agendamentos
    
    Returns:
        dict: Resultado com lista de eventos criados e erros
    """
    resultados = {
        'success': True,
        'eventos_criados': [],
        'erros': []
    }
    
    for agendamento in lista_agendamentos:
        resultado = criar_evento_calendar(agendamento)
        
        if resultado['success']:
            resultados['eventos_criados'].append({
                'event_id': resultado['event_id'],
                'link': resultado['link'],
                'data': agendamento.get('data')
            })
        else:
            resultados['erros'].append({
                'data': agendamento.get('data'),
                'erro': resultado['error']
            })
            resultados['success'] = False
    
    resultados['total_criados'] = len(resultados['eventos_criados'])
    resultados['total_erros'] = len(resultados['erros'])
    
    return resultados
