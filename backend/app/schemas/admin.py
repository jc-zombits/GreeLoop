from pydantic import BaseModel


class AdminRoleUpdate(BaseModel):
    make_admin: bool