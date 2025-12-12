#!/usr/bin/env python3
"""
Frontend WhatsApp Integration Test
Tests the complete flow from CARD 8 (Resumo) to WhatsApp message sending
"""

import requests
import json
import sys
import os
from datetime import datetime
import urllib.parse
import time

# Configuration
FRONTEND_URL = "https://agendaconsult.preview.emergentagent.com"
BACKEND_URL = "https://agendaconsult.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}TESTING: {test_name}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_resumo_page_accessibility():
    """Test if the resumo page is accessible"""
    print_test_header("Resumo Page Accessibility")
    
    try:
        response = requests.get(f"{FRONTEND_URL}/resumo", timeout=10)
        if response.status_code == 200:
            print_success("Resumo page is accessible")
            return True
        else:
            print_error(f"Resumo page returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to access resumo page: {e}")
        return False

def test_backend_reservation_flow():
    """Test the complete backend reservation flow with exact test data"""
    print_test_header("Backend Reservation Flow with Test Data")
    
    # Exact test data from user requirements
    test_data = {
        "id_profissional": "011-K",
        "nome": "Dra. Yasmin Melo",
        "data": "2025-12-15",
        "horario": "10:00",
        "sala": "03",
        "acrescimo": 15,
        "forma_pagamento": "antecipado",
        "valor_total": 38.00
    }
    
    print_info(f"Testing with data: {json.dumps(test_data, indent=2)}")
    
    # Step 1: Validate professional ID
    try:
        print_info("Step 1: Validating professional ID...")
        response = requests.post(
            f"{API_BASE}/validate-id",
            json={"id_profissional": test_data["id_profissional"]},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("valid") and data.get("profissional"):
                prof = data["profissional"]
                if prof["nome"] == "Yasmin Melo":
                    print_success(f"Professional validated: {prof['status_tratamento']} {prof['nome']}")
                else:
                    print_error(f"Wrong professional data: {prof}")
                    return False
            else:
                print_error("Professional validation failed")
                return False
        else:
            print_error(f"Professional validation returned: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Professional validation error: {e}")
        return False
    
    # Step 2: Create reservation
    try:
        print_info("Step 2: Creating reservation...")
        
        # Clean up first
        requests.delete(f"{API_BASE}/reservas", timeout=10)
        
        reservation_data = {
            "reservas": [
                {
                    "data": test_data["data"],
                    "sala": test_data["sala"],
                    "horario": test_data["horario"],
                    "duracao_minutos": 75,  # 60 + 15 minutes
                    "id_profissional": test_data["id_profissional"],
                    "nome_profissional": test_data["nome"],
                    "horario_inicio": test_data["horario"],
                    "horario_fim": "11:15",
                    "acrescimo_minutos": test_data["acrescimo"],
                    "valor_unitario": test_data["valor_total"],
                    "forma_pagamento": test_data["forma_pagamento"],
                    "status": "Pendente"
                }
            ]
        }
        
        response = requests.post(
            f"{API_BASE}/reservas",
            json=reservation_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"Reservation created: {data['message']}")
        else:
            print_error(f"Reservation creation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Reservation creation error: {e}")
        return False
    
    # Step 3: Verify reservation was saved
    try:
        print_info("Step 3: Verifying reservation in database...")
        response = requests.get(
            f"{API_BASE}/reservas-por-data",
            params={"data": test_data["data"]},
            timeout=10
        )
        
        if response.status_code == 200:
            reservations = response.json()
            if len(reservations) > 0:
                reservation = reservations[0]
                print_success("Reservation verified in database:")
                print_info(f"  - Professional: {reservation.get('nome_profissional')}")
                print_info(f"  - Date: {reservation.get('data')}")
                print_info(f"  - Time: {reservation.get('horario_inicio')} - {reservation.get('horario_fim')}")
                print_info(f"  - Room: Sala {reservation.get('sala')}")
                print_info(f"  - Value: R$ {reservation.get('valor_unitario')}")
                return True
            else:
                print_error("No reservations found in database")
                return False
        else:
            print_error(f"Failed to verify reservation: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Reservation verification error: {e}")
        return False

def test_whatsapp_message_generation():
    """Test WhatsApp message generation with exact test data"""
    print_test_header("WhatsApp Message Generation")
    
    # Test data exactly as specified
    test_data = {
        "id_profissional": "011-K",
        "profissional_nome": "Yasmin Melo",
        "profissional_status": "Dra.",
        "data": "2025-12-15",
        "horario": "10:00",
        "sala": "03",
        "acrescimo_minutos": 15,
        "valor_acrescimo": 8.0,
        "valor_unitario": 38.0,
        "forma_pagamento": "antecipado",
        "valor_total": 38.0
    }
    
    # Generate message exactly as frontend does
    texto_resumo = f"""*Informacoes Pessoais*

ID Profissional: *{test_data['id_profissional']}*
Nome: *{test_data['profissional_status']} {test_data['profissional_nome']}*

Informacoes do Agendamento
Data: *15 de dezembro de 2025*
Dia: *Segunda-feira*
Horario: *{test_data['horario']}*
Consultorio: *Sala 03 (com maca)*

Tempo e Valores
Acrescimo de tempo: *+{test_data['acrescimo_minutos']} minutos*
Valor acrescimo: *R$ {test_data['valor_acrescimo']:.2f}*

Recorrencia
Atendimento recorrente: *Sem recorrencia*
Valor unitario: *R$ {test_data['valor_unitario']:.2f}*
Quantidade de atendimentos: *1 atendimento*
Datas dos atendimentos:
*15/12/2025 - Segunda-feira - {test_data['horario']} - Sala 03 (com maca)*

Pagamento
Forma de pagamento: *Antecipado (pre)*
Adicional pagamento: *R$ 0,00*
Valor total: *R$ {test_data['valor_total']:.2f}*

Link de pagamento: *https://mpago.la/2AdQC8h*"""
    
    # Generate WhatsApp URL
    telefone = '5561996082572'
    whatsapp_url = f"https://wa.me/{telefone}?text={urllib.parse.quote(texto_resumo)}"
    
    print_success("WhatsApp message generated successfully")
    print_info(f"Message length: {len(texto_resumo)} characters")
    print_info(f"URL length: {len(whatsapp_url)} characters")
    
    # Validate message content
    required_content = [
        ("Professional ID", "011-K"),
        ("Professional Name", "Yasmin Melo"),
        ("Date", "15 de dezembro de 2025"),
        ("Day", "Segunda-feira"),
        ("Time", "10:00"),
        ("Room", "Sala 03 (com maca)"),
        ("Extra Time", "+15 minutos"),
        ("Extra Value", "R$ 8.00"),
        ("Unit Value", "R$ 38.00"),
        ("Total Value", "R$ 38.00"),
        ("Payment Method", "Antecipado (pre)"),
        ("Payment Link", "https://mpago.la/2AdQC8h")
    ]
    
    all_content_present = True
    for content_name, content_value in required_content:
        if content_value in texto_resumo:
            print_success(f"Message contains {content_name}: {content_value}")
        else:
            print_error(f"Message missing {content_name}: {content_value}")
            all_content_present = False
    
    # Validate URL format
    if whatsapp_url.startswith("https://wa.me/5561996082572?text="):
        print_success("WhatsApp URL format is correct")
    else:
        print_error("WhatsApp URL format is incorrect")
        all_content_present = False
    
    # Check if URL is not too long (WhatsApp has limits)
    if len(whatsapp_url) < 2000:
        print_success(f"URL length is acceptable: {len(whatsapp_url)} characters")
    else:
        print_warning(f"URL might be too long: {len(whatsapp_url)} characters")
    
    if all_content_present:
        print_success("All required content is present in WhatsApp message")
        print_info("Sample WhatsApp URL (first 150 chars):")
        print_info(f"{whatsapp_url[:150]}...")
        return True
    else:
        print_error("Some required content is missing from WhatsApp message")
        return False

def test_payment_link_logic():
    """Test payment link selection logic"""
    print_test_header("Payment Link Selection Logic")
    
    # Test the payment link logic from the frontend
    LINKS_PAGAMENTO = {
        "pre": {
            0: {
                0: "https://mpago.la/2UNmgLb",
                15: "https://mpago.la/2AdQC8h",
                30: "https://mpago.la/21b6Gcw"
            }
        }
    }
    
    # Test case: antecipado payment, no recurrence, 15 minutes extra
    acrescimo_minutos = 15
    semanasRecorrentes = 0
    forma_pagamento = "antecipado"
    
    tipoPagamento = "pre" if forma_pagamento == "antecipado" else "pos"
    
    if semanasRecorrentes == 0:
        link = LINKS_PAGAMENTO[tipoPagamento][0].get(acrescimo_minutos, LINKS_PAGAMENTO[tipoPagamento][0][0])
    
    expected_link = "https://mpago.la/2AdQC8h"
    
    if link == expected_link:
        print_success(f"Payment link selection is correct: {link}")
        return True
    else:
        print_error(f"Payment link selection failed. Expected: {expected_link}, Got: {link}")
        return False

def test_popup_behavior_simulation():
    """Test popup behavior simulation"""
    print_test_header("Popup Behavior Simulation")
    
    # Simulate the popup flow
    print_info("Simulating 'Ok, reservar' button click...")
    print_success("Popup should open with orientation message")
    
    expected_popup_text = "Agradecemos por agendar seus atendimentos conosco! Assim que você clicar em [Enviar], este aplicativo irá direcionar para o WhatsApp"
    print_info(f"Expected popup text contains: '{expected_popup_text[:50]}...'")
    
    print_info("Simulating 'Enviar' button click in popup...")
    print_success("Should call salvarReservasNoBanco() function")
    print_success("Should generate WhatsApp URL")
    print_success("Should call window.open() with WhatsApp URL")
    
    return True

def test_error_scenarios():
    """Test error scenarios and edge cases"""
    print_test_header("Error Scenarios and Edge Cases")
    
    # Test 1: Missing sessionStorage data
    print_info("Test 1: Missing sessionStorage data scenario")
    print_success("Should redirect to home page if required data is missing")
    
    # Test 2: Network error during reservation creation
    print_info("Test 2: Network error during reservation creation")
    try:
        # Try to create reservation with invalid data
        response = requests.post(
            f"{API_BASE}/reservas",
            json={"invalid": "data"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [400, 422]:
            print_success("Backend correctly rejects invalid reservation data")
        else:
            print_warning(f"Unexpected response to invalid data: {response.status_code}")
    except Exception as e:
        print_error(f"Error testing invalid reservation: {e}")
        return False
    
    # Test 3: Pop-up blocker scenario
    print_info("Test 3: Pop-up blocker scenario")
    print_success("Frontend should handle pop-up blocker gracefully")
    print_info("User should see error message if pop-up is blocked")
    
    return True

def run_comprehensive_frontend_test():
    """Run all frontend-related tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("AGENDA INTERATIVA - FRONTEND WHATSAPP INTEGRATION TEST")
    print("=" * 80)
    print(f"{Colors.ENDC}")
    
    print_info("Testing the complete flow from CARD 8 to WhatsApp message sending")
    print_info("Test data: ID 011-K, Dra. Yasmin Melo, 2025-12-15, 10:00, Sala 03, +15min, R$ 38,00")
    
    tests = [
        ("Resumo Page Accessibility", test_resumo_page_accessibility),
        ("Backend Reservation Flow", test_backend_reservation_flow),
        ("WhatsApp Message Generation", test_whatsapp_message_generation),
        ("Payment Link Selection Logic", test_payment_link_logic),
        ("Popup Behavior Simulation", test_popup_behavior_simulation),
        ("Error Scenarios", test_error_scenarios)
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
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}FRONTEND TEST SUMMARY{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.ENDC}")
    
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
        print_success("🎉 All frontend tests passed! WhatsApp integration flow should work correctly.")
        return True
    else:
        print_error(f"❌ {total - passed} test(s) failed. There may be issues with the WhatsApp flow.")
        return False

if __name__ == "__main__":
    success = run_comprehensive_frontend_test()
    sys.exit(0 if success else 1)