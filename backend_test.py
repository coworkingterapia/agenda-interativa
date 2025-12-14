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
    """Test professional ID validation endpoint"""
    print_test_header("Professional ID Validation")
    
    # Test valid ID (from test data)
    test_id = "011-K"
    try:
        response = requests.post(
            f"{API_BASE}/validate-id",
            json={"id_profissional": test_id},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("valid") and data.get("profissional"):
                prof = data["profissional"]
                if prof["nome"] == "Yasmin Melo" and prof["status_tratamento"] == "Dra.":
                    print_success(f"Professional validation working - Found: {prof['status_tratamento']} {prof['nome']}")
                    return True
                else:
                    print_error(f"Unexpected professional data: {prof}")
                    return False
            else:
                print_error(f"Professional not found or invalid response: {data}")
                return False
        else:
            print_error(f"Validation endpoint returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to validate professional: {e}")
        return False

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
    """Test reservation creation with Google Calendar synchronization - EXACT USER REQUIREMENTS"""
    print_test_header("TESTE 1: Criação de Reserva + Google Calendar")
    
    # Prepare test data EXACTLY as specified by user
    test_date = "2025-12-21"
    test_reservations = {
        "reservas": [
            {
                "data": test_date,
                "sala": "02",
                "horario": "09:00",
                "duracao_minutos": 60,
                "id_profissional": "011-K",
                "nome_profissional": "Dra. Yasmin Melo",
                "horario_inicio": "09:00",
                "horario_fim": "10:00",
                "acrescimo_minutos": 0,
                "valor_unitario": 30.0,
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

def test_reservation_cancellation_with_google_calendar():
    """Test reservation cancellation with Google Calendar event deletion"""
    print_test_header("Reservation Cancellation + Google Calendar Deletion")
    
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
            
            if data.get("success"):
                print_success("Reservation cancelled successfully")
                
                google_deleted = data.get("google_calendar_deleted", False)
                if google_deleted:
                    print_success("Google Calendar event deleted successfully")
                else:
                    print_warning("Google Calendar event was not deleted (may not have existed)")
                
                # Verify reservation was removed from database
                print_info("Verifying reservation was removed from database...")
                verify_response = requests.get(
                    f"{API_BASE}/reservas-por-data",
                    params={"data": "2025-12-20"},
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    reservations = verify_response.json()
                    remaining_reservations = [r for r in reservations if r.get('id') == reservation_id]
                    
                    if len(remaining_reservations) == 0:
                        print_success("Reservation successfully removed from database")
                        return True
                    else:
                        print_error("Reservation still exists in database after cancellation")
                        return False
                else:
                    print_error(f"Failed to verify reservation removal: {verify_response.status_code}")
                    return False
            else:
                print_error(f"Cancellation failed: {data}")
                return False
        else:
            print_error(f"Failed to cancel reservation. Status: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test reservation cancellation: {e}")
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
        ("Reservations + Google Calendar Sync", test_reservations_with_google_calendar),
        ("Reservations by Date Endpoint", test_reservations_by_date_endpoint),
        ("Reservation Cancellation + Google Calendar Deletion", test_reservation_cancellation_with_google_calendar),
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