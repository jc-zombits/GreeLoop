from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.community_post import PostType

# Esquemas base
class CommunityPostBase(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="Título del post (opcional)")
    content: str = Field(..., min_length=1, max_length=5000, description="Contenido del post")
    post_type: PostType = Field(PostType.GENERAL, description="Tipo de publicación")
    image_url: Optional[str] = Field(None, description="URL de imagen opcional")

# Esquema para crear un post
class CommunityPostCreate(CommunityPostBase):
    pass

# Esquema para actualizar un post
class CommunityPostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    post_type: Optional[PostType] = None
    image_url: Optional[str] = None

# Esquema para el autor del post
class PostAuthor(BaseModel):
    id: UUID
    name: str
    username: str
    avatar: str
    location: str

    class Config:
        from_attributes = True

# Esquema para respuesta de post
class CommunityPost(CommunityPostBase):
    id: UUID
    author_id: UUID
    author: PostAuthor
    likes_count: int = 0
    comments_count: int = 0
    is_active: bool = True
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquema para lista de posts
class CommunityPostList(BaseModel):
    posts: List[CommunityPost]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

# Esquemas para likes
class CommunityPostLikeCreate(BaseModel):
    pass

class CommunityPostLike(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas para comentarios
class CommunityPostCommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Contenido del comentario")

class CommunityPostCommentCreate(CommunityPostCommentBase):
    pass

class CommunityPostCommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=1000)

class CommentAuthor(BaseModel):
    id: UUID
    name: str
    username: str
    avatar: str

    class Config:
        from_attributes = True

class CommunityPostComment(CommunityPostCommentBase):
    id: UUID
    post_id: UUID
    author_id: UUID
    author: CommentAuthor
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquema para lista de comentarios
class CommunityPostCommentList(BaseModel):
    comments: List[CommunityPostComment]
    total: int
    page: int
    limit: int

# Esquemas de respuesta para operaciones
class PostResponse(BaseModel):
    message: str
    post: Optional[CommunityPost] = None

class LikeResponse(BaseModel):
    message: str
    liked: bool
    likes_count: int

class CommentResponse(BaseModel):
    message: str
    comment: Optional[CommunityPostComment] = None