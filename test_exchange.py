import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

# Función para registrar un usuario
def register_user(username, email, password, first_name, last_name, city="Bogotá", country="Colombia"):
    url = f"{BASE_URL}/auth/register"
    data = {
        "username": username,
        "email": email,
        "password": password,
        "confirm_password": password,
        "first_name": first_name,
        "last_name": last_name,
        "city": city,
        "country": country,
        "accept_terms": True,
        "accept_privacy": True
    }
    response = requests.post(url, json=data)
    return response

# Función para hacer login
def login_user(email, password):
    url = f"{BASE_URL}/auth/login"
    data = {
        "email": email,
        "password": password
    }
    response = requests.post(url, json=data)
    return response

# Función para crear un ítem
def create_item(token, title, description, category_id, condition, estimated_value, location):
    url = f"{BASE_URL}/items"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": title,
        "description": description,
        "category_id": category_id,
        "condition": condition,
        "estimated_value": estimated_value,
        "location": location,
        "status": "available"
    }
    response = requests.post(url, json=data, headers=headers)
    return response

# Función para crear un intercambio
def create_exchange(token, requester_item_id, owner_item_id, message):
    url = f"{BASE_URL}/exchanges"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "requester_item_id": requester_item_id,
        "owner_item_id": owner_item_id,
        "message": message
    }
    response = requests.post(url, json=data, headers=headers)
    return response

# Función para obtener intercambios
def get_exchanges(token):
    url = f"{BASE_URL}/exchanges"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    return response

# Función para aceptar un intercambio
def accept_exchange(token, exchange_id):
    url = f"{BASE_URL}/exchanges/{exchange_id}/accept"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(url, headers=headers)
    return response

# Función para obtener categorías
def get_categories():
    url = f"{BASE_URL}/categories"
    response = requests.get(url)
    return response

def main():
    print("=== Prueba de Funcionalidad de Intercambios ===")
    print("Configuración: Colombia (UTC-5)")
    
    # 1. Registrar usuarios
    print("\n1. Registrando usuarios...")
    
    user1_response = register_user(
        username="carlos_bogota",
        email="carlos@example.com", 
        password="Password123",
        first_name="Carlos",
        last_name="Rodríguez"
    )
    
    if user1_response.status_code == 200:
        print("✓ Usuario 1 (Carlos) registrado exitosamente")
    else:
        print(f"✗ Error registrando usuario 1: {user1_response.status_code} - {user1_response.text}")
        # Intentar login si ya existe
        user1_login = login_user("carlos@example.com", "Password123")
        if user1_login.status_code == 200:
            print("✓ Usuario 1 ya existía, login exitoso")
        else:
            print(f"✗ Error en login usuario 1: {user1_login.status_code}")
            return
    
    user2_response = register_user(
        username="maria_medellin",
        email="maria@example.com",
        password="Password123", 
        first_name="María",
        last_name="González"
    )
    
    if user2_response.status_code == 200:
        print("✓ Usuario 2 (María) registrado exitosamente")
    else:
        print(f"✗ Error registrando usuario 2: {user2_response.status_code} - {user2_response.text}")
        # Intentar login si ya existe
        user2_login = login_user("maria@example.com", "Password123")
        if user2_login.status_code == 200:
            print("✓ Usuario 2 ya existía, login exitoso")
        else:
            print(f"✗ Error en login usuario 2: {user2_login.status_code}")
            return
    
    # 2. Hacer login
    print("\n2. Haciendo login...")
    
    user1_login = login_user("carlos@example.com", "Password123")
    if user1_login.status_code == 200:
        login_response = user1_login.json()
        print(f"Login response structure: {login_response.keys()}")
        user1_token = login_response["tokens"]["access_token"]
        print("✓ Login Carlos exitoso")
    else:
        print(f"✗ Error en login Carlos: {user1_login.status_code}")
        print(f"Response: {user1_login.text}")
        return
    
    user2_login = login_user("maria@example.com", "Password123")
    if user2_login.status_code == 200:
        login_response = user2_login.json()
        user2_token = login_response["tokens"]["access_token"]
        print("✓ Login María exitoso")
    else:
        print(f"✗ Error en login María: {user2_login.status_code}")
        print(f"Response: {user2_login.text}")
        return
    
    # 3. Obtener categorías disponibles
    print("\n3. Obteniendo categorías...")
    
    categories_response = get_categories()
    if categories_response.status_code == 200:
        categories_data = categories_response.json()
        categories = categories_data.get('categories', [])
        if categories:
            category_id = categories[0]['id']
            print(f"✓ Usando categoría: {categories[0]['name']} (ID: {category_id})")
        else:
            print("✗ No hay categorías disponibles")
            return
    else:
        print(f"✗ Error obteniendo categorías: {categories_response.status_code}")
        return
    
    # 4. Crear ítems para cada usuario
    print("\n4. Creando ítems...")
    
    # Carlos crea un ítem
    item1_response = create_item(
        user1_token,
        "Bicicleta de montaña",
        "Bicicleta Trek en excelente estado, poco uso",
        category_id,
        "excellent",
        800000,
        "Bogotá, Colombia"
    )
    
    if item1_response.status_code in [200, 201]:
        item1_data = item1_response.json()
        item1_id = item1_data["id"]
        print(f"✓ Carlos creó ítem: {item1_data['title']} (ID: {item1_id})")
    else:
        print(f"✗ Error creando ítem de Carlos: {item1_response.status_code} - {item1_response.text}")
        return
    
    # María crea un ítem
    item2_response = create_item(
        user2_token,
        "Guitarra acústica",
        "Guitarra Yamaha FG800, ideal para principiantes",
        category_id,
        "good",
        600000,
        "Medellín, Colombia"
    )
    
    if item2_response.status_code in [200, 201]:
        item2_data = item2_response.json()
        item2_id = item2_data["id"]
        print(f"✓ María creó ítem: {item2_data['title']} (ID: {item2_id})")
    else:
        print(f"✗ Error creando ítem de María: {item2_response.status_code} - {item2_response.text}")
        return
    
    # 5. Carlos solicita intercambio con María
    print("\n5. Creando solicitud de intercambio...")
    
    exchange_response = create_exchange(
        user1_token,
        item1_id,  # Carlos es el requester con su bicicleta
        item2_id,  # María es la owner de la guitarra
        "Hola María, me interesa tu guitarra. ¿Te gustaría intercambiarla por mi bicicleta?"
    )
    
    if exchange_response.status_code in [200, 201]:
        exchange_data = exchange_response.json()
        exchange_id = exchange_data["id"]
        print(f"✓ Carlos creó solicitud de intercambio (ID: {exchange_id})")
        print(f"  Ofrecido: {exchange_data.get('offered_item', {}).get('title', 'N/A')}")
        print(f"  Solicitado: {exchange_data.get('requested_item', {}).get('title', 'N/A')}")
    else:
        print(f"✗ Error creando intercambio: {exchange_response.status_code} - {exchange_response.text}")
        return
    
    # 6. María ve sus intercambios
    print("\n6. María revisa sus intercambios...")
    
    maria_exchanges = get_exchanges(user2_token)
    if maria_exchanges.status_code == 200:
        exchanges_data = maria_exchanges.json()
        print(f"✓ María tiene {len(exchanges_data.get('exchanges', []))} intercambio(s)")
        
        for exchange in exchanges_data.get('exchanges', []):
            print(f"  - Intercambio {exchange['id']}: {exchange['status']}")
    else:
        print(f"✗ Error obteniendo intercambios de María: {maria_exchanges.status_code}")
        return
    
    # 7. María acepta el intercambio
    print("\n7. María acepta el intercambio...")
    
    accept_response = accept_exchange(user2_token, exchange_id)
    if accept_response.status_code in [200, 201]:
        accept_data = accept_response.json()
        print(f"✓ María aceptó el intercambio")
        print(f"  Estado: {accept_data.get('status', 'N/A')}")
        print(f"  Mensaje: {accept_data.get('message', 'N/A')}")
    else:
        print(f"✗ Error aceptando intercambio: {accept_response.status_code} - {accept_response.text}")
        return
    
    # 8. Verificar estado final
    print("\n8. Verificando estado final...")
    
    final_exchanges = get_exchanges(user1_token)
    if final_exchanges.status_code == 200:
        exchanges_data = final_exchanges.json()
        print(f"✓ Carlos ve {len(exchanges_data.get('exchanges', []))} intercambio(s)")
        
        for exchange in exchanges_data.get('exchanges', []):
            print(f"  - Intercambio {exchange['id']}: {exchange['status']}")
    else:
        print(f"✗ Error obteniendo intercambios finales: {final_exchanges.status_code}")
    
    print("\n=== Prueba de intercambios completada ===")

if __name__ == "__main__":
    main()