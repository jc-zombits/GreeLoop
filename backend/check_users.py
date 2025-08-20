import asyncio
from app.core.database import get_db
from app.models.user import User
from sqlalchemy import select

async def check_users():
    async for db in get_db():
        result = await db.execute(select(User.email, User.username))
        users = result.all()
        print('Usuarios registrados:')
        for user in users:
            print(f'Email: {user[0]}, Username: {user[1]}')
        break

if __name__ == "__main__":
    asyncio.run(check_users())