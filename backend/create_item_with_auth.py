import asyncio
import httpx
import json

async def create_item_with_fresh_token():
    base_url = "http://localhost:8000"
    
    # 1. Hacer login para obtener token fresco
    login_data = {
        "email": "newuser@test.com",
        "password": "Password123"
    }
    
    async with httpx.AsyncClient() as client:
        # Login
        login_response = await client.post(
            f"{base_url}/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status_code != 200:
            print(f"Error en login: {login_response.text}")
            return
        
        login_result = login_response.json()
        access_token = login_result["tokens"]["access_token"]
        print(f"Token obtenido: {access_token[:50]}...")
        
        # 2. Crear ítem inmediatamente
        item_data = {
            "title": "iPhone 13 Pro",
            "description": "iPhone 13 Pro en excelente estado, usado por 6 meses. Incluye cargador original y funda protectora. Batería al 95% de capacidad.",
            "category_id": "96a86b12-d520-4c9d-acf7-d66ccb119027",
            "condition": "like_new",
            "estimated_value": 800.00,
            "city": "Madrid",
            "state": "Madrid",
            "country": "España",
            "is_available_for_exchange": True,
            "accepts_cash_difference": True,
            "max_cash_difference": 100.00,
            "exchange_preferences": "Busco intercambiar por laptop gaming o tablet profesional",
            "show_exact_location": False
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        item_response = await client.post(
            f"{base_url}/api/v1/items/",
            json=item_data,
            headers=headers
        )
        
        print(f"Status code: {item_response.status_code}")
        
        if item_response.status_code in [200, 201]:
            print("¡Ítem creado exitosamente!")
            item_data = item_response.json()
            print(f"ID del ítem: {item_data['id']}")
            print(f"Título: {item_data['title']}")
            print(f"Descripción: {item_data['description']}")
            print(f"Categoría: {item_data['category']['name']}")
            print(f"Condición: {item_data['condition_display']}")
            print(f"Estado: {item_data['status_display']}")
            print(f"Ubicación: {item_data['location_description']}")
            print(f"Valor estimado: ${item_data['estimated_value']}")
        else:
            print(f"Error al crear ítem: {item_response.text}")

if __name__ == "__main__":
    asyncio.run(create_item_with_fresh_token())