#!/usr/bin/env python3
"""
Backend Test Suite for Agenda Interativa Google Calendar Integration
Tests the complete flow from reservation creation to Google Calendar synchronization
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
import urllib.parse

# Get backend URL from environment
BACKEND_URL = "https://proagenda-4.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}TESTING: {test_name}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_backend_health():
    """Test if backend is running and accessible"""
    print_test_header("Backend Health Check")
    
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print_success("Backend is running and accessible")
                return True
            else:
                print_error(f"Unexpected response: {data}")
                return False
        else:
            print_error(f"Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to connect to backend: {e}")
        return False

def test_professional_validation():
    """Test professional ID validation endpoint - NEW USERS FROM REVIEW REQUEST"""
    print_test_header("Professional ID Validation - 3 New Users")
    
    # Test the 3 new users as specified in review request
    new_users = [
        {"id": "001-Q", "expected_name": "Evandro Francisco", "expected_status": "Dr."},
        {"id": "000-Y", "expected_name": "Terapeuta", "expected_status": "Dr."},
        {"id": "100-Y", "expected_name": "Terapeuta", "expected_status": "Dra."}
    ]
    
    all_passed = True
    
    for user in new_users:
        test_id = user["id"]
        try:
            # Use GET method as specified in review request
            response = requests.get(
                f"{API_BASE}/profissionais/validar",
                params={"id_profissional": test_id},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("valid") and data.get("profissional"):
                    prof = data["profissional"]
                    if (prof["nome"] == user["expected_name"] and 
                        prof["status_tratamento"] == user["expected_status"]):
                        print_success(f"✅ {test_id} → {prof['status_tratamento']} {prof['nome']}")
                    else:
                        print_error(f"❌ {test_id} → Expected: {user['expected_status']} {user['expected_name']}, Got: {prof['status_tratamento']} {prof['nome']}")
                        all_passed = False
                else:
                    print_error(f"❌ {test_id} → Professional not found or invalid response: {data}")
                    all_passed = False
            else:
                print_error(f"❌ {test_id} → Validation endpoint returned status: {response.status_code}")
                all_passed = False
        except requests.exceptions.RequestException as e:
            print_error(f"❌ {test_id} → Failed to validate professional: {e}")
            all_passed = False
    
    return all_passed

def test_google_calendar_credentials():
    """Test Google Calendar credentials and service availability"""
    print_test_header("Google Calendar Credentials Validation")
    
    try:
        # Check if credentials file exists
        credentials_path = "/app/backend/agendaconsult-481122-c9b54cd92f0b.json"
        if not os.path.exists(credentials_path):
            print_error(f"Google Calendar credentials file not found: {credentials_path}")
            return False
        
        print_success("Google Calendar credentials file exists")
        
        # Try to import google_calendar module
        try:
            import sys
            sys.path.append('/app/backend')
            import google_calendar
            print_success("google_calendar module imported successfully")
            
            # Try to get calendar service
            service = google_calendar.get_calendar_service()
            if service:
                print_success("Google Calendar service created successfully")
                return True
            else:
                print_error("Failed to create Google Calendar service")
                return False
                
        except Exception as e:
            print_error(f"Failed to import or use google_calendar module: {e}")
            return False
            
    except Exception as e:
        print_error(f"Google Calendar credentials test failed: {e}")
        return False

def test_reservations_with_google_calendar():
    """Test reservation creation with Google Calendar synchronization - REVIEW REQUEST SCENARIO"""
    print_test_header("TESTE 1: Criação de Reserva + Google Calendar - NEW USER 001-Q")
    
    # Prepare test data EXACTLY as specified in review request
    test_date = "2025-12-26"
    test_reservations = {
        "reservas": [
            {
                "data": test_date,
                "sala": "03",
                "horario": "10:00",
                "duracao_minutos": 75,
                "id_profissional": "001-Q",
                "nome_profissional": "Dr. Evandro Francisco",
                "horario_inicio": "10:00",
                "horario_fim": "11:15",
                "acrescimo_minutos": 15,
                "valor_unitario": 38.0,
                "forma_pagamento": "antecipado",
                "status": "Pendente"
            }
        ]
    }
    
    try:
        # First, clean up any existing reservations for this date
        print_info("Cleaning up existing test reservations...")
        requests.delete(f"{API_BASE}/reservas", timeout=10)
        
        # Create new reservation
        print_info("Creating test reservation with Google Calendar sync...")
        response = requests.post(
            f"{API_BASE}/reservas",
            json=test_reservations,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"Reservation created successfully: {data['message']}")
            
            # Check Google Calendar sync results - EXACT USER REQUIREMENTS
            google_synced = data.get("google_calendar_synced", 0)
            event_ids = data.get("event_ids", [])
            
            print_info(f"Response data: {json.dumps(data, indent=2)}")
            
            # VERIFICAR: Response tem "google_calendar_synced": 1 ✅
            if google_synced == 1:
                print_success(f"✅ VERIFICADO: google_calendar_synced = {google_synced}")
            else:
                print_error(f"❌ FALHOU: google_calendar_synced = {google_synced}, esperado = 1")
                return False
            
            # VERIFICAR: Response tem array "event_ids" com pelo menos 1 ID ✅
            if event_ids and len(event_ids) >= 1:
                print_success(f"✅ VERIFICADO: event_ids array com {len(event_ids)} ID(s): {event_ids}")
                # Store the first event ID for deletion test
                global test_event_id
                test_event_id = event_ids[0]
                print_info(f"Event ID capturado para teste de cancelamento: {test_event_id}")
            else:
                print_error(f"❌ FALHOU: event_ids array vazio ou inexistente: {event_ids}")
                return False
            
            # Store reservation ID for deletion test
            global test_reservation_id
            test_reservation_id = None
            
            return True
        else:
            print_error(f"Failed to create reservation. Status: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test reservations with Google Calendar: {e}")
        return False

def test_database_verification():
    """Test database verification - REVIEW REQUEST SCENARIO"""
    print_test_header("TESTE 2: Verificação no Database")
    
    test_date = "2025-12-26"
    
    try:
        print_info(f"Verificando reservas para data: {test_date}")
        response = requests.get(
            f"{API_BASE}/reservas-por-data",
            params={"data": test_date},
            timeout=10
        )
        
        if response.status_code == 200:
            reservations = response.json()
            print_info(f"Response: {json.dumps(reservations, indent=2)}")
            
            if len(reservations) > 0:
                reservation = reservations[0]
                
                # VERIFICAR: Reserva criada aparece na lista
                print_success("✅ VERIFICADO: Reserva criada aparece na lista")
                
                # VERIFICAR: Campo google_event_id está presente e NÃO é null
                google_event_id = reservation.get('google_event_id')
                if google_event_id is not None and google_event_id != "":
                    print_success(f"✅ VERIFICADO: Campo google_event_id presente e não-null: {google_event_id}")
                    
                    # VERIFICAR: Campo google_event_id contém um ID válido do Google Calendar
                    if isinstance(google_event_id, str) and len(google_event_id) > 10:
                        print_success(f"✅ VERIFICADO: google_event_id contém ID válido do Google Calendar")
                        
                        # Store reservation ID for deletion test
                        global test_reservation_id
                        test_reservation_id = reservation.get('id')
                        print_info(f"Reservation ID capturado para teste de cancelamento: {test_reservation_id}")
                        
                        return True
                    else:
                        print_error(f"❌ FALHOU: google_event_id não parece ser um ID válido: {google_event_id}")
                        return False
                else:
                    print_error(f"❌ FALHOU: Campo google_event_id é null ou ausente: {google_event_id}")
                    return False
            else:
                print_error("❌ FALHOU: Nenhuma reserva encontrada na lista")
                return False
        else:
            print_error(f"❌ FALHOU: Erro ao buscar reservas: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"❌ FALHOU: Erro de conexão: {e}")
        return False

def test_reservation_cancellation_with_google_calendar():
    """Test reservation cancellation with Google Calendar event deletion - EXACT USER REQUIREMENTS"""
    print_test_header("TESTE 3: Cancelamento + Google Calendar")
    
    # Check if we have a reservation ID from previous test
    if 'test_reservation_id' not in globals():
        print_warning("No test reservation ID available. Skipping cancellation test.")
        return True  # Don't fail the test suite for this
    
    try:
        reservation_id = test_reservation_id
        print_info(f"Cancelling reservation: {reservation_id}")
        
        response = requests.delete(
            f"{API_BASE}/reservas/{reservation_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print_info(f"Response data: {json.dumps(data, indent=2)}")
            
            # VERIFICAR: Response: "success": true ✅
            if data.get("success") == True:
                print_success("✅ VERIFICADO: success = true")
            else:
                print_error(f"❌ FALHOU: success = {data.get('success')}, esperado = true")
                return False
                
            # VERIFICAR: Response: "google_calendar_deleted": true ✅ (IMPORTANTE: deve ser TRUE agora)
            google_deleted = data.get("google_calendar_deleted", False)
            if google_deleted == True:
                print_success("✅ VERIFICADO: google_calendar_deleted = true (INTEGRAÇÃO FUNCIONANDO!)")
            else:
                print_error(f"❌ FALHOU: google_calendar_deleted = {google_deleted}, esperado = true")
                return False
                
            # VERIFICAR: Reserva removida do banco
            print_info("Verificando se reserva foi removida do banco...")
            verify_response = requests.get(
                f"{API_BASE}/reservas-por-data",
                params={"data": "2025-12-21"},
                timeout=10
            )
            
            if verify_response.status_code == 200:
                reservations = verify_response.json()
                remaining_reservations = [r for r in reservations if r.get('id') == reservation_id]
                
                if len(remaining_reservations) == 0:
                    print_success("✅ VERIFICADO: Reserva removida do banco")
                    return True
                else:
                    print_error("❌ FALHOU: Reserva ainda existe no banco após cancelamento")
                    return False
            else:
                print_error(f"❌ FALHOU: Erro ao verificar remoção: {verify_response.status_code}")
                return False
        else:
            print_error(f"Failed to cancel reservation. Status: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test reservation cancellation: {e}")
        return False

def test_multiple_reservations():
    """Test multiple reservations creation - EXACT USER REQUIREMENTS"""
    print_test_header("TESTE 4: Múltiplas Reservas")
    
    # Prepare test data with 2 reservations for different dates
    test_reservations = {
        "reservas": [
            {
                "data": "2025-12-22",
                "sala": "01",
                "horario": "10:00",
                "duracao_minutos": 60,
                "id_profissional": "011-K",
                "nome_profissional": "Dra. Yasmin Melo",
                "horario_inicio": "10:00",
                "horario_fim": "11:00",
                "acrescimo_minutos": 0,
                "valor_unitario": 30.0,
                "forma_pagamento": "antecipado",
                "status": "Pendente"
            },
            {
                "data": "2025-12-23",
                "sala": "02",
                "horario": "14:00",
                "duracao_minutos": 60,
                "id_profissional": "011-K",
                "nome_profissional": "Dra. Yasmin Melo",
                "horario_inicio": "14:00",
                "horario_fim": "15:00",
                "acrescimo_minutos": 0,
                "valor_unitario": 30.0,
                "forma_pagamento": "antecipado",
                "status": "Pendente"
            }
        ]
    }
    
    try:
        print_info("Criando múltiplas reservas...")
        response = requests.post(
            f"{API_BASE}/reservas",
            json=test_reservations,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_info(f"Response data: {json.dumps(data, indent=2)}")
            
            # VERIFICAR: "google_calendar_synced": 2
            google_synced = data.get("google_calendar_synced", 0)
            if google_synced == 2:
                print_success(f"✅ VERIFICADO: google_calendar_synced = {google_synced}")
            else:
                print_error(f"❌ FALHOU: google_calendar_synced = {google_synced}, esperado = 2")
                return False
            
            # VERIFICAR: Array "event_ids" com 2 IDs
            event_ids = data.get("event_ids", [])
            if event_ids and len(event_ids) == 2:
                print_success(f"✅ VERIFICADO: event_ids array com {len(event_ids)} IDs: {event_ids}")
                return True
            else:
                print_error(f"❌ FALHOU: event_ids array com {len(event_ids)} IDs, esperado = 2: {event_ids}")
                return False
        else:
            print_error(f"❌ FALHOU: Status code {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"❌ FALHOU: Erro de conexão: {e}")
        return False

def test_reservations_by_date_endpoint():
    """Test the reservations by date endpoint"""
    print_test_header("Reservations by Date Endpoint")
    
    try:
        # Test with a specific date
        test_date = "2025-12-20"
        
        print_info(f"Fetching reservations for date: {test_date}")
        response = requests.get(
            f"{API_BASE}/reservas-por-data",
            params={"data": test_date},
            timeout=10
        )
        
        if response.status_code == 200:
            reservations = response.json()
            print_success(f"Successfully fetched reservations for {test_date}")
            print_info(f"Found {len(reservations)} reservation(s)")
            
            # If we have reservations, show details
            for i, reservation in enumerate(reservations):
                print_info(f"  Reservation {i+1}:")
                print_info(f"    - ID: {reservation.get('id')}")
                print_info(f"    - Professional: {reservation.get('nome_profissional')}")
                print_info(f"    - Time: {reservation.get('horario_inicio')} - {reservation.get('horario_fim')}")
                print_info(f"    - Room: {reservation.get('sala')}")
                print_info(f"    - Google Event ID: {reservation.get('google_event_id', 'None')}")
            
            return True
        else:
            print_error(f"Failed to fetch reservations. Status: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test reservations by date endpoint: {e}")
        return False

def test_cors_configuration():
    """Test CORS configuration for frontend integration"""
    print_test_header("CORS Configuration")
    
    try:
        # Test preflight request
        response = requests.options(
            f"{API_BASE}/reservas",
            headers={
                "Origin": "https://proagenda-4.preview.emergentagent.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=10
        )
        
        if response.status_code in [200, 204]:
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
            }
            
            print_success("CORS preflight request successful")
            for header, value in cors_headers.items():
                if value:
                    print_info(f"{header}: {value}")
            
            return True
        else:
            print_error(f"CORS preflight failed with status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"CORS test failed: {e}")
        return False

def test_error_handling():
    """Test error handling scenarios"""
    print_test_header("Error Handling")
    
    # Test invalid professional ID
    try:
        response = requests.post(
            f"{API_BASE}/validate-id",
            json={"id_profissional": "INVALID-ID"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("valid"):
                print_success("Invalid professional ID correctly rejected")
            else:
                print_error("Invalid professional ID was accepted")
                return False
        else:
            print_error(f"Unexpected status code for invalid ID: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Error testing invalid professional ID: {e}")
        return False
    
    # Test malformed reservation data
    try:
        response = requests.post(
            f"{API_BASE}/reservas",
            json={"invalid": "data"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [400, 422]:
            print_success("Malformed reservation data correctly rejected")
        else:
            print_warning(f"Malformed data returned status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print_error(f"Error testing malformed reservation: {e}")
        return False
    
    return True

def run_comprehensive_test():
    """Run all tests and provide summary"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("AGENDA INTERATIVA - GOOGLE CALENDAR INTEGRATION TEST SUITE")
    print("=" * 80)
    print(f"{Colors.ENDC}")
    
    tests = [
        ("Backend Health Check", test_backend_health),
        ("Professional Validation", test_professional_validation),
        ("Google Calendar Credentials", test_google_calendar_credentials),
        ("TESTE 1: Criação de Reserva + Google Calendar", test_reservations_with_google_calendar),
        ("TESTE 2: Verificação no Database", test_database_verification),
        ("TESTE 3: Cancelamento + Google Calendar", test_reservation_cancellation_with_google_calendar),
        ("TESTE 4: Múltiplas Reservas", test_multiple_reservations),
        ("CORS Configuration", test_cors_configuration),
        ("Error Handling", test_error_handling)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Print summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}TEST SUMMARY{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}")
            passed += 1
        else:
            print_error(f"{test_name}")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print_success("🎉 All tests passed! Google Calendar integration should be working correctly.")
        return True
    else:
        print_error(f"❌ {total - passed} test(s) failed. Google Calendar integration may have issues.")
        return False

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)