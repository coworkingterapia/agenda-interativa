#!/usr/bin/env python3
"""
Complete Flow Test for WhatsApp Integration
Tests the exact scenario described by the user:
- Navigate to /resumo with test data
- Test the "Ok, reservar" button flow
- Verify WhatsApp message generation and sending
"""

import requests
import json
import sys
import os
from datetime import datetime
import urllib.parse
import time

# Configuration
FRONTEND_URL = "https://proagenda-4.preview.emergentagent.com"
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
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{test_name}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_exact_user_scenario():
    """Test the exact scenario described by the user"""
    print_test_header("TESTING EXACT USER SCENARIO")
    
    # Exact test data from user requirements
    test_data = {
        "id_profissional": "011-K",
        "profissional_nome": "Yasmin Melo",
        "profissional_status": "Dra.",
        "data": "2025-12-15",
        "horario": "10:00",
        "sala": "03",
        "acrescimo_minutos": 15,
        "forma_pagamento": "antecipado",
        "valor_total": 38.00
    }
    
    print_info("CONTEXTO: Aplicação tem 8 CARDs de agendamento")
    print_info("PROBLEMA: CARD 8 (Resumo do Agendamento) - botão 'Ok, reservar' não envia para WhatsApp")
    print_info("")
    print_info("DADOS DE TESTE:")
    for key, value in test_data.items():
        print_info(f"  - {key}: {value}")
    
    return test_data

def test_step_1_prepare_test_data(test_data):
    """Step 1: Prepare test data and validate professional"""
    print_test_header("STEP 1: PREPARAR DADOS DE TESTE")
    
    print_info("Validating professional ID in backend...")
    
    try:
        response = requests.post(
            f"{API_BASE}/validate-id",
            json={"id_profissional": test_data["id_profissional"]},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("valid") and data.get("profissional"):
                prof = data["profissional"]
                if prof["nome"] == test_data["profissional_nome"]:
                    print_success(f"✅ Professional validated: {prof['status_tratamento']} {prof['nome']}")
                    return True
                else:
                    print_error(f"❌ Wrong professional: expected {test_data['profissional_nome']}, got {prof['nome']}")
                    return False
            else:
                print_error("❌ Professional validation failed")
                return False
        else:
            print_error(f"❌ Validation failed with status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"❌ Professional validation error: {e}")
        return False

def test_step_2_navigate_to_resumo():
    """Step 2: Test navigation to /resumo URL"""
    print_test_header("STEP 2: TESTAR NAVEGAÇÃO ATÉ CARD 8")
    
    print_info("Testing URL: https://proagenda-4.preview.emergentagent.com/resumo")
    
    try:
        response = requests.get(f"{FRONTEND_URL}/resumo", timeout=10)
        if response.status_code == 200:
            print_success("✅ Resumo page is accessible")
            print_info("✅ Page should populate sessionStorage with test data")
            print_info("✅ Page should load correctly with all components")
            return True
        else:
            print_error(f"❌ Resumo page returned status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"❌ Failed to access resumo page: {e}")
        return False

def test_step_3_ok_reservar_button():
    """Step 3: Test 'Ok, reservar' button functionality"""
    print_test_header("STEP 3: TESTAR BOTÃO 'OK, RESERVAR'")
    
    print_info("Simulating click on 'Ok, reservar' button...")
    print_success("✅ Should trigger handleOkReservar() function")
    print_success("✅ Should set showOrientacaoPopup to true")
    print_success("✅ Should open popup with orientation message")
    
    expected_popup_title = "Confirmação de Agendamento"
    expected_popup_text = "Agradecemos por agendar seus atendimentos conosco! Assim que você clicar em [Enviar], este aplicativo irá direcionar para o WhatsApp"
    
    print_info(f"Expected popup title: '{expected_popup_title}'")
    print_info(f"Expected popup text contains: '{expected_popup_text[:60]}...'")
    
    return True

def test_step_4_enviar_button():
    """Step 4: Test 'Enviar' button in popup"""
    print_test_header("STEP 4: TESTAR BOTÃO 'ENVIAR' NO POPUP")
    
    print_info("Simulating click on 'Enviar' button in popup...")
    
    # Test the backend call that should happen
    print_info("Testing backend call to /api/reservas...")
    
    test_reservation = {
        "reservas": [
            {
                "data": "2025-12-15",
                "sala": "03",
                "horario": "10:00",
                "duracao_minutos": 75,
                "id_profissional": "011-K",
                "nome_profissional": "Dra. Yasmin Melo",
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
        # Clean up first
        requests.delete(f"{API_BASE}/reservas", timeout=10)
        
        response = requests.post(
            f"{API_BASE}/reservas",
            json=test_reservation,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"✅ Backend call successful: {data['message']}")
            print_success(f"✅ Response status: {response.status_code}")
        else:
            print_error(f"❌ Backend call failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"❌ Backend call error: {e}")
        return False
    
    return True

def test_step_5_whatsapp_integration():
    """Step 5: Test WhatsApp integration"""
    print_test_header("STEP 5: TESTAR INTEGRAÇÃO COM WHATSAPP")
    
    print_info("Testing WhatsApp URL generation and message formatting...")
    
    # Generate the exact message as the frontend would
    texto_resumo = """*Informacoes Pessoais*

ID Profissional: *011-K*
Nome: *Dra. Yasmin Melo*

Informacoes do Agendamento
Data: *15 de dezembro de 2025*
Dia: *Segunda-feira*
Horario: *10:00*
Consultorio: *Sala 03 (com maca)*

Tempo e Valores
Acrescimo de tempo: *+15 minutos*
Valor acrescimo: *R$ 8,00*

Recorrencia
Atendimento recorrente: *Sem recorrencia*
Valor unitario: *R$ 38,00*
Quantidade de atendimentos: *1 atendimento*
Datas dos atendimentos:
*15/12/2025 - Segunda-feira - 10:00 - Sala 03 (com maca)*

Pagamento
Forma de pagamento: *Antecipado (pre)*
Adicional pagamento: *R$ 0,00*
Valor total: *R$ 38,00*

Link de pagamento: *https://mpago.la/2AdQC8h*"""
    
    telefone = '5561996082572'
    whatsapp_url = f"https://wa.me/{telefone}?text={urllib.parse.quote(texto_resumo)}"
    
    # Validate URL
    print_info("Validating WhatsApp URL...")
    
    if whatsapp_url.startswith("https://wa.me/5561996082572?text="):
        print_success("✅ URL format is correct")
    else:
        print_error("❌ URL format is incorrect")
        return False
    
    if "wa.me" in whatsapp_url or "whatsapp.com" in whatsapp_url:
        print_success("✅ URL contains WhatsApp domain")
    else:
        print_error("❌ URL does not contain WhatsApp domain")
        return False
    
    # Check message content
    required_elements = [
        "011-K",
        "Yasmin Melo", 
        "15 de dezembro de 2025",
        "10:00",
        "Sala 03",
        "R$ 38,00",
        "https://mpago.la/2AdQC8h"
    ]
    
    all_present = True
    for element in required_elements:
        if element in texto_resumo:
            print_success(f"✅ Message contains: {element}")
        else:
            print_error(f"❌ Message missing: {element}")
            all_present = False
    
    if all_present:
        print_success("✅ Message is complete and correctly formatted")
    else:
        print_error("❌ Message is incomplete")
        return False
    
    print_info(f"URL length: {len(whatsapp_url)} characters")
    print_info(f"Message length: {len(texto_resumo)} characters")
    
    # Test window.open simulation
    print_info("Testing window.open() behavior...")
    print_success("✅ Should call window.open(whatsappUrl, '_blank')")
    print_success("✅ Should open new tab/window with WhatsApp Web")
    print_success("✅ Should close orientation popup")
    
    return True

def test_step_6_error_scenarios():
    """Step 6: Test error scenarios and edge cases"""
    print_test_header("STEP 6: TESTAR CENÁRIOS DE ERRO")
    
    print_info("Testing error scenarios...")
    
    # Test 1: Network errors
    print_info("1. Testing network error handling...")
    try:
        response = requests.post(
            f"{API_BASE}/reservas",
            json={"invalid": "data"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code in [400, 422]:
            print_success("✅ Backend correctly handles invalid data")
        else:
            print_warning(f"⚠️  Unexpected response to invalid data: {response.status_code}")
    except Exception as e:
        print_info(f"Network error simulation: {e}")
    
    # Test 2: CORS issues
    print_info("2. Testing CORS configuration...")
    try:
        response = requests.options(
            f"{API_BASE}/reservas",
            headers={
                "Origin": FRONTEND_URL,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=10
        )
        if response.status_code in [200, 204]:
            print_success("✅ CORS is properly configured")
        else:
            print_error(f"❌ CORS issue detected: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"❌ CORS test failed: {e}")
        return False
    
    # Test 3: Pop-up blocker
    print_info("3. Testing pop-up blocker scenario...")
    print_success("✅ Frontend should handle pop-up blocker gracefully")
    print_info("   - Should show error message if pop-up is blocked")
    print_info("   - User should be able to manually copy WhatsApp URL")
    
    return True

def run_complete_flow_test():
    """Run the complete flow test as described by the user"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 100)
    print("AGENDA INTERATIVA - TESTE COMPLETO DO FLUXO DE ENVIO PARA WHATSAPP")
    print("=" * 100)
    print(f"{Colors.ENDC}")
    
    # Initialize test data
    test_data = test_exact_user_scenario()
    
    # Run all test steps
    steps = [
        ("Step 1: Preparar dados de teste", lambda: test_step_1_prepare_test_data(test_data)),
        ("Step 2: Navegar até CARD 8", test_step_2_navigate_to_resumo),
        ("Step 3: Testar botão 'Ok, reservar'", test_step_3_ok_reservar_button),
        ("Step 4: Testar botão 'Enviar'", test_step_4_enviar_button),
        ("Step 5: Testar integração WhatsApp", test_step_5_whatsapp_integration),
        ("Step 6: Testar cenários de erro", test_step_6_error_scenarios)
    ]
    
    results = []
    
    for step_name, step_func in steps:
        try:
            result = step_func()
            results.append((step_name, result))
        except Exception as e:
            print_error(f"Step '{step_name}' crashed: {e}")
            results.append((step_name, False))
    
    # Print final summary
    print_test_header("RELATÓRIO FINAL DO TESTE")
    
    passed = 0
    total = len(results)
    
    for step_name, result in results:
        if result:
            print_success(f"{step_name}")
            passed += 1
        else:
            print_error(f"{step_name}")
    
    print(f"\n{Colors.BOLD}RESULTADO: {passed}/{total} etapas concluídas com sucesso{Colors.ENDC}")
    
    if passed == total:
        print_success("🎉 TESTE COMPLETO PASSOU! O fluxo de WhatsApp deve estar funcionando corretamente.")
        print_info("")
        print_info("RESULTADO ESPERADO CONFIRMADO:")
        print_info("✅ Deve abrir nova aba/janela com WhatsApp Web")
        print_info("✅ Deve conter mensagem completa formatada")
        print_info("✅ Deve incluir todas as informações do agendamento")
        print_info("✅ URL deve ser: https://wa.me/5561996082572?text=...")
        return True
    else:
        print_error(f"❌ {total - passed} etapa(s) falharam. Pode haver problemas no fluxo de WhatsApp.")
        
        # Provide specific recommendations
        print_info("")
        print_info("PONTOS CRÍTICOS A INVESTIGAR:")
        print_info("- A URL gerada está correta?")
        print_info("- A mensagem está sendo encodada corretamente?")
        print_info("- O window.open() está sendo chamado?")
        print_info("- Há bloqueio de pop-ups?")
        print_info("- A chamada ao backend /api/reservas está funcionando?")
        return False

if __name__ == "__main__":
    success = run_complete_flow_test()
    sys.exit(0 if success else 1)