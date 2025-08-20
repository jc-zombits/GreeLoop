import asyncio
import httpx
import json
from jose import jwt
from datetime import datetime
from app.core.config import settings

async def debug_token():
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
        print(f"Token obtenido: {access_token}")
        
        # 2. Decodificar el token para ver su contenido
        try:
            # Decodificar sin verificar para ver el contenido
            payload = jwt.decode(
                access_token,
                "",  # key vacía
                options={"verify_signature": False}
            )
            print(f"\nPayload del token:")
            print(json.dumps(payload, indent=2, default=str))
            
            # Verificar expiración
            exp = payload.get("exp")
            if exp:
                exp_datetime = datetime.fromtimestamp(exp)
                current_datetime = datetime.utcnow()
                print(f"\nTiempo actual (UTC): {current_datetime}")
                print(f"Expiración del token: {exp_datetime}")
                print(f"Diferencia: {exp_datetime - current_datetime}")
                print(f"¿Token expirado?: {current_datetime > exp_datetime}")
            
            # Intentar decodificar con verificación
            try:
                verified_payload = jwt.decode(
                    access_token,
                    settings.SECRET_KEY,
                    algorithms=[settings.JWT_ALGORITHM]
                )
                print(f"\n✅ Token verificado correctamente")
            except Exception as e:
                print(f"\n❌ Error al verificar token: {e}")
                
        except Exception as e:
            print(f"Error al decodificar token: {e}")

if __name__ == "__main__":
    asyncio.run(debug_token())