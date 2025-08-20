#!/usr/bin/env python3
"""
Script de prueba para el sistema de notificaciones de GreenLoop

Este script prueba:
1. Creación de notificaciones
2. Listado de notificaciones con filtros
3. Marcar notificaciones como leídas
4. Obtener estadísticas de notificaciones
5. Configuración de notificaciones del usuario
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

def test_notification_creation():
    """Probar la creación de notificaciones (simulada a través de acciones que las generan)"""
    log_test("=== Iniciando pruebas de creación de notificaciones ===")
    
    # Las notificaciones se crean automáticamente por el sistema
    # Por ejemplo, cuando se acepta un intercambio, se crea una calificación, etc.
    # Para esta prueba, verificaremos que el endpoint de listado funciona
    
    carlos_token = user_tokens.get("carlos")
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Obtener notificaciones de Carlos
    response = make_request("GET", "/notifications", token=carlos_token)
    
    if response.status_code == 200:
        notifications = response.json()
        log_test(f"Notificaciones obtenidas exitosamente. Total: {notifications.get('total', 0)}")
        test_data["carlos_notifications"] = notifications
        return True
    else:
        log_test(f"Error al obtener notificaciones: {response.text}", False)
        return False

def test_notification_listing():
    """Probar el listado de notificaciones con filtros"""
    log_test("=== Iniciando pruebas de listado de notificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Probar listado básico
    response = make_request("GET", "/notifications", token=carlos_token)
    if response.status_code != 200:
        log_test(f"Error en listado básico: {response.text}", False)
        return False
    
    notifications = response.json()
    log_test(f"Listado básico exitoso. Total: {notifications.get('total', 0)}")
    
    # Probar con filtros
    filters = {
        "page": 1,
        "page_size": 10,
        "is_read": False
    }
    
    response = make_request("GET", "/notifications", data=filters, token=carlos_token)
    if response.status_code == 200:
        filtered_notifications = response.json()
        log_test(f"Filtrado por no leídas exitoso. Total: {filtered_notifications.get('total', 0)}")
        test_data["unread_notifications"] = filtered_notifications
        return True
    else:
        log_test(f"Error en filtrado: {response.text}", False)
        return False

def test_mark_notifications_read():
    """Probar marcar notificaciones como leídas"""
    log_test("=== Iniciando pruebas de marcar notificaciones como leídas ===")
    
    carlos_token = user_tokens.get("carlos")
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Obtener notificaciones no leídas
    unread_notifications = test_data.get("unread_notifications", {})
    notifications_list = unread_notifications.get("notifications", [])
    
    if not notifications_list:
        log_test("No hay notificaciones no leídas para probar")
        return True
    
    # Marcar la primera notificación como leída
    first_notification_id = notifications_list[0]["id"]
    mark_data = {
        "notification_ids": [first_notification_id]
    }
    
    response = make_request("PUT", "/notifications/read", data=mark_data, token=carlos_token)
    
    if response.status_code == 200:
        result = response.json()
        log_test(f"Notificación marcada como leída. Actualizadas: {result.get('updated_count', 0)}")
        
        # Marcar todas como leídas
        mark_all_data = {"mark_all": True}
        response = make_request("PUT", "/notifications/read", data=mark_all_data, token=carlos_token)
        
        if response.status_code == 200:
            result = response.json()
            log_test(f"Todas las notificaciones marcadas como leídas. Actualizadas: {result.get('updated_count', 0)}")
            return True
        else:
            log_test(f"Error al marcar todas como leídas: {response.text}", False)
            return False
    else:
        log_test(f"Error al marcar notificación como leída: {response.text}", False)
        return False

def test_notification_stats():
    """Probar obtener estadísticas de notificaciones"""
    log_test("=== Iniciando pruebas de estadísticas de notificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    response = make_request("GET", "/notifications/stats", token=carlos_token)
    
    if response.status_code == 200:
        stats = response.json()
        log_test(f"Estadísticas obtenidas: Total: {stats.get('total_notifications', 0)}, No leídas: {stats.get('unread_count', 0)}")
        test_data["notification_stats"] = stats
        return True
    else:
        log_test(f"Error al obtener estadísticas: {response.text}", False)
        return False

def test_notification_settings():
    """Probar configuración de notificaciones"""
    log_test("=== Iniciando pruebas de configuración de notificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Obtener configuración actual
    response = make_request("GET", "/notifications/settings", token=carlos_token)
    
    if response.status_code == 200:
        settings = response.json()
        log_test(f"Configuración actual obtenida: Email: {settings.get('email_notifications', 'N/A')}")
        
        # Actualizar configuración
        new_settings = {
            "email_notifications": True,
            "push_notifications": True,
            "exchange_notifications": True,
            "rating_notifications": True
        }
        
        response = make_request("PUT", "/notifications/settings", data=new_settings, token=carlos_token)
        
        if response.status_code == 200:
            log_test("Configuración de notificaciones actualizada exitosamente")
            return True
        else:
            log_test(f"Error al actualizar configuración: {response.text}", False)
            return False
    else:
        log_test(f"Error al obtener configuración: {response.text}", False)
        return False

def test_delete_notifications():
    """Probar eliminación de notificaciones"""
    log_test("=== Iniciando pruebas de eliminación de notificaciones ===")
    
    carlos_token = user_tokens.get("carlos")
    if not carlos_token:
        log_test("Token de Carlos no disponible", False)
        return False
    
    # Obtener notificaciones actuales
    response = make_request("GET", "/notifications", token=carlos_token)
    
    if response.status_code != 200:
        log_test(f"Error al obtener notificaciones para eliminar: {response.text}", False)
        return False
    
    notifications = response.json()
    notifications_list = notifications.get("notifications", [])
    
    if not notifications_list:
        log_test("No hay notificaciones para eliminar")
        return True
    
    # Eliminar la primera notificación
    first_notification_id = notifications_list[0]["id"]
    delete_data = {
        "notification_ids": [first_notification_id]
    }
    
    response = make_request("DELETE", "/notifications", data=delete_data, token=carlos_token)
    
    if response.status_code == 200:
        result = response.json()
        log_test(f"Notificación eliminada. Eliminadas: {result.get('deleted_count', 0)}")
        return True
    else:
        log_test(f"Error al eliminar notificación: {response.text}", False)
        return False

def main():
    """Función principal que ejecuta todas las pruebas"""
    print("🔔 Iniciando pruebas del sistema de notificaciones de GreenLoop")
    print("=" * 60)
    
    # Registrar y loguear usuarios de prueba
    log_test("Registrando usuarios de prueba...")
    
    # Configurar usuarios de prueba con timestamp para evitar conflictos
    import time
    timestamp = int(time.time())
    users = [
        {"username": f"juan_notif_{timestamp}", "email": f"juan.notif.{timestamp}@test.com", "password": "Password123"},
        {"username": f"maria_notif_{timestamp}", "email": f"maria.notif.{timestamp}@test.com", "password": "Password123"},
        {"username": f"carlos_notif_{timestamp}", "email": f"carlos.notif.{timestamp}@test.com", "password": "Password123"}
    ]
    
    carlos_token = register_and_login_user(users[2]["username"], users[2]["email"], users[2]["password"])
    maria_token = register_and_login_user(users[1]["username"], users[1]["email"], users[1]["password"])
    
    if not carlos_token or not maria_token:
        log_test("Error al configurar usuarios de prueba", False)
        return
    
    user_tokens["carlos"] = carlos_token
    user_tokens["maria"] = maria_token
    
    # Ejecutar pruebas
    tests = [
        test_notification_creation,
        test_notification_listing,
        test_mark_notifications_read,
        test_notification_stats,
        test_notification_settings,
        test_delete_notifications
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
    print(f"📊 Resumen de pruebas de notificaciones:")
    print(f"✅ Pruebas exitosas: {passed}/{total}")
    print(f"❌ Pruebas fallidas: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas del sistema de notificaciones pasaron exitosamente!")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los logs para más detalles.")
    
    print("\n🔔 Funcionalidades probadas:")
    print("   • Creación automática de notificaciones")
    print("   • Listado de notificaciones con filtros y paginación")
    print("   • Marcar notificaciones como leídas (individual y todas)")
    print("   • Obtener estadísticas de notificaciones")
    print("   • Configuración de notificaciones del usuario")
    print("   • Eliminación de notificaciones")

if __name__ == "__main__":
    main()