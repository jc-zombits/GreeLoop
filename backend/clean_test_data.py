import asyncio
import uuid
from app.core.database import get_db
from app.models.user import User
from app.models.item import Item
from app.models.item_image import ItemImage
from app.models.exchange import Exchange
from app.models.message import Message
from app.models.notification import Notification
from app.models.rating import Rating
from app.models.user_session import UserSession
from app.models.category import Category
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

async def clean_test_data():
    """
    Limpia todos los datos de prueba de la base de datos manteniendo:
    - La estructura de las tablas
    - Las categorías básicas necesarias para el funcionamiento
    """
    print("🧹 Iniciando limpieza de datos de prueba...")
    
    async for db in get_db():
        try:
            # 1. Eliminar en orden correcto para respetar las foreign keys
            print("📝 Eliminando mensajes...")
            await db.execute(delete(Message))
            
            print("🔔 Eliminando notificaciones...")
            await db.execute(delete(Notification))
            
            print("⭐ Eliminando calificaciones...")
            await db.execute(delete(Rating))
            
            print("🔄 Eliminando intercambios...")
            await db.execute(delete(Exchange))
            
            print("🖼️ Eliminando imágenes de items...")
            await db.execute(delete(ItemImage))
            
            print("📦 Eliminando items...")
            await db.execute(delete(Item))
            
            print("🔐 Eliminando sesiones de usuario...")
            await db.execute(delete(UserSession))
            
            print("👥 Eliminando usuarios...")
            await db.execute(delete(User))
            
            # 2. Mantener solo categorías esenciales
            print("🏷️ Limpiando categorías y manteniendo solo las esenciales...")
            
            # Eliminar todas las categorías existentes
            await db.execute(delete(Category))
            
            # Crear categorías básicas esenciales
            essential_categories = [
                {
                    "id": uuid.uuid4(),
                    "name": "Electrónicos",
                    "slug": "electronicos",
                    "description": "Dispositivos electrónicos, smartphones, tablets, laptops",
                    "icon": "smartphone",
                    "color": "#3B82F6",
                    "is_active": True,
                    "sort_order": 1
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Ropa y Accesorios",
                    "slug": "ropa-accesorios",
                    "description": "Ropa, zapatos, bolsos, accesorios de moda",
                    "icon": "shirt",
                    "color": "#EC4899",
                    "is_active": True,
                    "sort_order": 2
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Hogar y Jardín",
                    "slug": "hogar-jardin",
                    "description": "Muebles, decoración, herramientas de jardín",
                    "icon": "home",
                    "color": "#10B981",
                    "is_active": True,
                    "sort_order": 3
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Deportes y Recreación",
                    "slug": "deportes-recreacion",
                    "description": "Equipos deportivos, bicicletas, juegos",
                    "icon": "dumbbell",
                    "color": "#F59E0B",
                    "is_active": True,
                    "sort_order": 4
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Libros y Medios",
                    "slug": "libros-medios",
                    "description": "Libros, películas, música, videojuegos",
                    "icon": "book",
                    "color": "#8B5CF6",
                    "is_active": True,
                    "sort_order": 5
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Vehículos",
                    "slug": "vehiculos",
                    "description": "Automóviles, motocicletas, bicicletas",
                    "icon": "car",
                    "color": "#EF4444",
                    "is_active": True,
                    "sort_order": 6
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Arte y Manualidades",
                    "slug": "arte-manualidades",
                    "description": "Obras de arte, materiales de manualidades, instrumentos",
                    "icon": "palette",
                    "color": "#06B6D4",
                    "is_active": True,
                    "sort_order": 7
                },
                {
                    "id": uuid.uuid4(),
                    "name": "Otros",
                    "slug": "otros",
                    "description": "Artículos que no encajan en otras categorías",
                    "icon": "grid",
                    "color": "#6B7280",
                    "is_active": True,
                    "sort_order": 8
                }
            ]
            
            for cat_data in essential_categories:
                category = Category(**cat_data)
                db.add(category)
            
            # 3. Confirmar todos los cambios
            await db.commit()
            
            print("✅ Limpieza completada exitosamente!")
            print("📊 Resumen:")
            print("   - Todos los usuarios de prueba eliminados")
            print("   - Todos los items eliminados")
            print("   - Todos los intercambios eliminados")
            print("   - Todos los mensajes eliminados")
            print("   - Todas las notificaciones eliminadas")
            print("   - Todas las calificaciones eliminadas")
            print("   - Todas las sesiones eliminadas")
            print(f"   - {len(essential_categories)} categorías esenciales recreadas")
            print("")
            print("🎯 La aplicación está lista para usuarios reales!")
            print("   Ahora puedes:")
            print("   1. Registrar un usuario real")
            print("   2. Subir items reales")
            print("   3. Crear intercambios reales")
            print("   4. Probar toda la funcionalidad")
            
        except Exception as e:
            print(f"❌ Error durante la limpieza: {e}")
            await db.rollback()
            raise
        finally:
            break

async def verify_cleanup():
    """
    Verifica que la limpieza se haya realizado correctamente
    """
    print("\n🔍 Verificando limpieza...")
    
    async for db in get_db():
        try:
            # Contar registros en cada tabla
            user_count = await db.execute(select(User.id))
            users = len(user_count.fetchall())
            
            item_count = await db.execute(select(Item.id))
            items = len(item_count.fetchall())
            
            exchange_count = await db.execute(select(Exchange.id))
            exchanges = len(exchange_count.fetchall())
            
            message_count = await db.execute(select(Message.id))
            messages = len(message_count.fetchall())
            
            category_count = await db.execute(select(Category.id))
            categories = len(category_count.fetchall())
            
            print(f"📊 Estado actual de la base de datos:")
            print(f"   - Usuarios: {users}")
            print(f"   - Items: {items}")
            print(f"   - Intercambios: {exchanges}")
            print(f"   - Mensajes: {messages}")
            print(f"   - Categorías: {categories}")
            
            if users == 0 and items == 0 and exchanges == 0 and messages == 0 and categories > 0:
                print("✅ Limpieza verificada correctamente!")
            else:
                print("⚠️ La limpieza puede no haberse completado correctamente.")
                
        except Exception as e:
            print(f"❌ Error durante la verificación: {e}")
        finally:
            break

if __name__ == "__main__":
    print("🚨 ADVERTENCIA: Este script eliminará TODOS los datos de prueba.")
    print("   Solo mantendrá la estructura de tablas y categorías esenciales.")
    print("   ¿Estás seguro de que quieres continuar? (y/N): ", end="")
    
    confirmation = input().lower().strip()
    
    if confirmation in ['y', 'yes', 'sí', 'si']:
        asyncio.run(clean_test_data())
        asyncio.run(verify_cleanup())
    else:
        print("❌ Operación cancelada.")