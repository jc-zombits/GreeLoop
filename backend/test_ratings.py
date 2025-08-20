#!/usr/bin/env python3
"""
Script de prueba para el sistema de ratings/calificaciones de GreenLoop

Este script prueba:
1. Creación de calificaciones
2. Listado de calificaciones con filtros
3. Obtener estadísticas de calificaciones de usuario
4. Calificaciones pendientes
5. Configuración de calificaciones
6. Actualización de calificaciones
"""

import asyncio
import requests
import json
from datetime import datetime
from typing import Dict, Any

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

# Variables globales para almacenar tokens y datos
user_tokens = {}
test_data = {}

def log_test(message: str, success: bool = True):
    """Función para logging de pruebas"""
    status = "✅" if success else "❌"
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status} {message}")

def make_request(method: str, endpoint: str, data: Dict[Any, Any] = None, token: str = None) -> requests.Response:
    """Función helper para hacer requests"""
    url = f"{BASE_URL}{endpoint}"
    headers = HEADERS.copy()
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if method.upper() == "GET":
        response = requests.get(url, headers=headers, params=data)
    elif method.upper() == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method.upper() == "PUT":
        response = requests.put(url, headers=headers, json=data)
    elif method.upper() == "DELETE":
        response = requests.delete(url, headers=headers, json=data)
    else:
        raise ValueError(f"Método HTTP no soportado: {method}")
    
    return response

def register_and_login_user(username: str, email: str, password: str) -> str:
    """Registrar y hacer login de un usuario"""
    # Intentar registro
    register_data = {
        "username": username,
        "email": email,
        "password": password,
        "confirm_password": password,
        "first_name": f"Usuario",
        "last_name": username,
        "city": "Bogotá",
        "country": "Colombia",
        "accept_terms": True,
        "accept_privacy": True
    }
    
    register_response = make_request("POST", "/auth/register", register_data)
    if register_response.status_code not in [200, 201, 400]:  # 400 si ya existe
        log_test(f"Error al registrar usuario {username}: {register_response.text}", False)
        return None
    
    # Si el usuario ya existe (400), continuamos con el login
    if register_response.status_code == 400:
        log_test(f"Usuario {username} ya existe, procediendo con login")
    
    # Login
    login_data = {
        "email": email,
        "password": password
    }
    
    login_response = make_request("POST", "/auth/login", login_data)
    if login_response.status_code != 200:
        log_test(f"Error al hacer login con {username}: {login_response.text}", False)
        return None
    
    response_data = login_response.json()
    token = response_data["tokens"]["access_token"]
    log_test(f"Usuario {username} registrado y logueado exitosamente")
    return token

def create_test_items_and_exchange():
    """Crear items de prueba y un intercambio para poder calificar"""
    log_test("=== Creando items y intercambio de prueba ===")
    
    carlos_token = user_tokens.get("carlos")
    maria_token = user_tokens.get("maria")
    
    if not carlos_token or not maria_token:
        log_test("Tokens de usuarios no disponibles", False)
        return False
    
    # Obtener categorías disponibles
    response = make_request("GET", "/categories")
    if response.status_code != 200:
        log_test(f"Error al obtener categorías: {response.text}", False)
        return False
    
    categories = response.json()["categories"]
    if not categories:
        log_test("No hay categorías disponibles", False)
        return False
    
    category_id = categories[0]["id"]  # Usar la primera categoría disponible
    
    # Crear item de Carlos
    carlos_item_data = {
        "title": "Libro de Python para Ratings",
        "description": "Libro técnico para intercambio",
        "category_id": category_id,
        "condition": "good",
        "estimated_value": 25.0,
        "location": "Madrid",
        "is_available": True
    }
    
    response = make_request("POST", "/items", data=carlos_item_data, token=carlos_token)
    if response.status_code not in [200, 201]:
        log_test(f"Error al crear item de Carlos: {response.text}", False)
        return False
    
    carlos_item = response.json()
    test_data["carlos_item_id"] = carlos_item["id"]
    log_test(f"Item de Carlos creado: {carlos_item['title']}")
    
    # Crear item de María
    maria_item_data = {
        "title": "Revista de Tecnología para Ratings",
        "description": "Revista especializada",
        "category_id": category_id,
        "condition": "excellent",
        "estimated_value": 15.0,
        "location": "Barcelona",
        "is_available": True
    }
    
    response = make_request("POST", "/items", data=maria_item_data, token=maria_token)
    if response.status_code not in [200, 201]:
        log_test(f"Error al crear item de María: {response.text}", False)
        return False
    
    maria_item = response.json()
    test_data["maria_item_id"] = maria_item["id"]
    log_test(f"Item de María creado: {maria_item['title']}")
    
    # Crear solicitud de intercambio
    exchange_data = {
        "requester_item_id": carlos_item["id"],
        "owner_item_id": maria_item["id"],
        "message": "Me interesa tu revista, ¿intercambiamos?"
    }
    
    response = make_request("POST", "/exchanges", data=exchange_data, token=carlos_token)
    if response.status_code not in [200, 201]:
        log_test(f"Error al crear intercambio: {response.text}", False)
        return False
    
    exchange = response.json()
    test_data["exchange_id"] = exchange["id"]
    log_test(f"Intercambio creado con ID: {exchange['id']}")
    
    # Aceptar el intercambio
    response = make_request("POST", f"/exchanges/{exchange['id']}/accept", token=maria_token)
    if response.status_code != 200:
        log_test(f"Error al aceptar intercambio: {response.text}", False)
        return False
    
    log_test("Intercambio aceptado exitosamente")
    
    # Para las pruebas de calificaciones, necesitamos un intercambio completado
    # Como no hay un endpoint directo para marcar como completado desde estado 'accepted',
    # vamos a simular esto creando un segundo intercambio que podamos completar
    # o modificar directamente en la base de datos
    
    # Intentar usar el endpoint de completar intercambio
    # Primero necesitamos cambiar el estado a 'in_progress' o 'meeting_arranged'
    try:
        # Intentar marcar como completado usando el endpoint específico
        completion_data = {
            "completed": True,
            "completion_notes": "Intercambio realizado exitosamente para pruebas"
        }
        
        response = make_request("POST", f"/exchanges/{exchange['id']}/complete", data=completion_data, token=maria_token)
        
        if response.status_code == 200:
            log_test("Intercambio marcado como completado usando endpoint /complete")
        else:
            log_test(f"No se pudo completar intercambio: {response.text}")
            # Para las pruebas, vamos a continuar sin intercambio completado
            # Las pruebas de calificaciones fallarán pero probaremos el resto
            
    except Exception as e:
        log_test(f"Error al completar intercambio: {e}")
    
    return True

def test_rating_creation():
    """Probar la creación de calificaciones"""
    log_test("=== Iniciando pruebas de creación de calificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    maria_token = user_tokens.get("maria")
    exchange_id = test_data.get("exchange_id")
    
    if not carlos_token or not maria_token or not exchange_id:
        log_test("Datos necesarios no disponibles", False)
        return False
    
    # Obtener IDs de usuarios
    carlos_profile = make_request("GET", "/auth/me", token=carlos_token)
    maria_profile = make_request("GET", "/auth/me", token=maria_token)
    
    if carlos_profile.status_code != 200 or maria_profile.status_code != 200:
        log_test("Error al obtener perfiles de usuarios", False)
        return False
    
    carlos_id = carlos_profile.json()["id"]
    maria_id = maria_profile.json()["id"]
    
    test_data["carlos_id"] = carlos_id
    test_data["maria_id"] = maria_id
    
    # Carlos califica a María
    carlos_rating_data = {
        "exchange_id": exchange_id,
        "rated_user_id": maria_id,
        "overall_rating": 5,
        "communication_rating": 5,
        "punctuality_rating": 4,
        "item_condition_rating": 5,
        "friendliness_rating": 5,
        "comment": "Excelente intercambio, muy buena comunicación",
        "would_exchange_again": True
    }
    
    response = make_request("POST", "/ratings", data=carlos_rating_data, token=carlos_token)
    
    if response.status_code in [200, 201]:
        carlos_rating = response.json()
        test_data["carlos_rating_id"] = carlos_rating["id"]
        log_test(f"Calificación de Carlos a María creada exitosamente (Rating: {carlos_rating['overall_rating']})")
        
        # María califica a Carlos
        maria_rating_data = {
            "exchange_id": exchange_id,
            "rated_user_id": carlos_id,
            "overall_rating": 4,
            "communication_rating": 4,
            "punctuality_rating": 5,
            "item_condition_rating": 4,
            "friendliness_rating": 4,
            "comment": "Buen intercambio, todo correcto",
            "would_exchange_again": True
        }
        
        response = make_request("POST", "/ratings", data=maria_rating_data, token=maria_token)
        
        if response.status_code in [200, 201]:
            maria_rating = response.json()
            test_data["maria_rating_id"] = maria_rating["id"]
            log_test(f"Calificación de María a Carlos creada exitosamente (Rating: {maria_rating['overall_rating']})")
            return True
        else:
            log_test(f"Error al crear calificación de María: {response.text}", False)
            return False
    else:
        log_test(f"Error al crear calificación de Carlos: {response.text}", False)
        return False

def test_rating_listing():
    """Probar el listado de calificaciones"""
    log_test("=== Iniciando pruebas de listado de calificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    maria_id = test_data.get("maria_id")
    
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Listar todas las calificaciones del usuario actual
    response = make_request("GET", "/ratings", token=carlos_token)
    
    if response.status_code == 200:
        ratings = response.json()
        log_test(f"Listado de calificaciones exitoso. Total: {ratings.get('total', 0)}")
        test_data["carlos_ratings"] = ratings
        
        # Listar calificaciones de María específicamente
        if maria_id:
            params = {"user_id": maria_id}
            response = make_request("GET", "/ratings", data=params, token=carlos_token)
            
            if response.status_code == 200:
                maria_ratings = response.json()
                log_test(f"Calificaciones de María obtenidas. Total: {maria_ratings.get('total', 0)}")
                
                # Probar filtros de calificación
                params = {"min_rating": 4, "max_rating": 5}
                response = make_request("GET", "/ratings", data=params, token=carlos_token)
                
                if response.status_code == 200:
                    filtered_ratings = response.json()
                    log_test(f"Filtrado por calificación (4-5) exitoso. Total: {filtered_ratings.get('total', 0)}")
                    return True
                else:
                    log_test(f"Error en filtrado por calificación: {response.text}", False)
                    return False
            else:
                log_test(f"Error al obtener calificaciones de María: {response.text}", False)
                return False
        else:
            return True
    else:
        log_test(f"Error al listar calificaciones: {response.text}", False)
        return False

def test_user_rating_stats():
    """Probar obtener estadísticas de calificaciones de usuario"""
    log_test("=== Iniciando pruebas de estadísticas de calificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    maria_id = test_data.get("maria_id")
    carlos_id = test_data.get("carlos_id")
    
    if not carlos_token or not maria_id:
        log_test("Datos necesarios no disponibles", False)
        return False
    
    # Obtener estadísticas de María
    response = make_request("GET", f"/ratings/stats/{maria_id}", token=carlos_token)
    
    if response.status_code == 200:
        maria_stats = response.json()
        log_test(f"Estadísticas de María: Promedio {maria_stats.get('average_rating', 'N/A')}, Total recibidas: {maria_stats.get('total_ratings_received', 0)}")
        
        # Obtener estadísticas de Carlos
        response = make_request("GET", f"/ratings/stats/{carlos_id}", token=carlos_token)
        
        if response.status_code == 200:
            carlos_stats = response.json()
            log_test(f"Estadísticas de Carlos: Promedio {carlos_stats.get('average_rating', 'N/A')}, Total recibidas: {carlos_stats.get('total_ratings_received', 0)}")
            test_data["rating_stats"] = {"maria": maria_stats, "carlos": carlos_stats}
            return True
        else:
            log_test(f"Error al obtener estadísticas de Carlos: {response.text}", False)
            return False
    else:
        log_test(f"Error al obtener estadísticas de María: {response.text}", False)
        return False

def test_pending_ratings():
    """Probar obtener calificaciones pendientes"""
    log_test("=== Iniciando pruebas de calificaciones pendientes ===")
    
    carlos_token = user_tokens.get("carlos")
    
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    response = make_request("GET", "/ratings/pending", token=carlos_token)
    
    if response.status_code == 200:
        pending = response.json()
        log_test(f"Calificaciones pendientes obtenidas. Total: {pending.get('total', 0)}, Vencidas: {pending.get('overdue_count', 0)}")
        test_data["pending_ratings"] = pending
        return True
    else:
        log_test(f"Error al obtener calificaciones pendientes: {response.text}", False)
        return False

def test_rating_settings():
    """Probar configuración de calificaciones"""
    log_test("=== Iniciando pruebas de configuración de calificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Obtener configuración actual
    response = make_request("GET", "/ratings/settings", token=carlos_token)
    
    if response.status_code == 200:
        settings = response.json()
        log_test(f"Configuración actual: Email recordatorios: {settings.get('email_rating_reminders', 'N/A')}")
        
        # Actualizar configuración
        new_settings = {
            "email_rating_reminders": True,
            "push_rating_reminders": False,
            "show_ratings_publicly": True,
            "allow_rating_comments": True
        }
        
        response = make_request("PUT", "/ratings/settings", data=new_settings, token=carlos_token)
        
        if response.status_code == 200:
            log_test("Configuración de calificaciones actualizada exitosamente")
            return True
        else:
            log_test(f"Error al actualizar configuración: {response.text}", False)
            return False
    else:
        log_test(f"Error al obtener configuración: {response.text}", False)
        return False

def test_rating_update():
    """Probar actualización de calificaciones"""
    log_test("=== Iniciando pruebas de actualización de calificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    carlos_rating_id = test_data.get("carlos_rating_id")
    
    if not carlos_token or not carlos_rating_id:
        log_test("Datos necesarios no disponibles", False)
        return False
    
    # Actualizar la calificación de Carlos
    update_data = {
        "overall_rating": 5,
        "comment": "Actualizado: Excelente intercambio, muy recomendado",
        "friendliness_rating": 5
    }
    
    response = make_request("PUT", f"/ratings/{carlos_rating_id}", data=update_data, token=carlos_token)
    
    if response.status_code == 200:
        updated_rating = response.json()
        log_test(f"Calificación actualizada exitosamente. Nueva calificación: {updated_rating['overall_rating']}")
        return True
    else:
        log_test(f"Error al actualizar calificación: {response.text}", False)
        return False

def main():
    """Función principal que ejecuta todas las pruebas"""
    print("⭐ Iniciando pruebas del sistema de calificaciones de GreenLoop")
    print("=" * 60)
    
    # Generar usuarios únicos con timestamp
    import time
    timestamp = int(time.time())
    
    # Registrar y loguear usuarios de prueba
    log_test("Registrando usuarios de prueba...")
    
    carlos_token = register_and_login_user(f"carlos_rating_{timestamp}", f"carlos.rating.{timestamp}@test.com", "Password123")
    maria_token = register_and_login_user(f"maria_rating_{timestamp}", f"maria.rating.{timestamp}@test.com", "Password123")
    
    if not carlos_token or not maria_token:
        log_test("Error al configurar usuarios de prueba", False)
        return
    
    user_tokens["carlos"] = carlos_token
    user_tokens["maria"] = maria_token
    
    # Crear datos de prueba
    if not create_test_items_and_exchange():
        log_test("Error al crear datos de prueba", False)
        return
    
    # Ejecutar pruebas
    tests = [
        test_rating_creation,
        test_rating_listing,
        test_user_rating_stats,
        test_pending_ratings,
        test_rating_settings,
        test_rating_update
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            log_test(f"Error en {test_func.__name__}: {str(e)}", False)
    
    print("\n" + "=" * 60)
    print(f"📊 Resumen de pruebas de calificaciones:")
    print(f"✅ Pruebas exitosas: {passed}/{total}")
    print(f"❌ Pruebas fallidas: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas del sistema de calificaciones pasaron exitosamente!")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los logs para más detalles.")
    
    print("\n⭐ Funcionalidades probadas:")
    print("   • Creación de calificaciones después de intercambios")
    print("   • Listado de calificaciones con filtros y paginación")
    print("   • Estadísticas detalladas de calificaciones por usuario")
    print("   • Calificaciones pendientes y recordatorios")
    print("   • Configuración de preferencias de calificaciones")
    print("   • Actualización de calificaciones existentes")

if __name__ == "__main__":
    main()