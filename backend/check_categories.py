import asyncio
from app.core.database import get_db
from app.models.category import Category
from sqlalchemy import select

async def check_categories():
    async for db in get_db():
        result = await db.execute(select(Category.id, Category.name, Category.slug).where(Category.is_active == True))
        categories = result.all()
        print('Categorías disponibles:')
        for cat in categories:
            print(f'ID: {cat.id}, Nombre: {cat.name}, Slug: {cat.slug}')
        break

if __name__ == "__main__":
    asyncio.run(check_categories())