import asyncio
import uuid
from app.core.database import get_db
from app.models.category import Category
from sqlalchemy import select

async def create_category():
    async for db in get_db():
        # Crear una categoría básica
        new_category = Category(
            id=uuid.uuid4(),
            name="Electrónicos",
            slug="electronicos",
            description="Dispositivos electrónicos y gadgets",
            icon="smartphone",
            color="#3B82F6",
            is_active=True,
            sort_order=1
        )
        
        db.add(new_category)
        await db.commit()
        await db.refresh(new_category)
        
        print(f"Categoría creada: ID={new_category.id}, Nombre={new_category.name}")
        break

if __name__ == "__main__":
    asyncio.run(create_category())