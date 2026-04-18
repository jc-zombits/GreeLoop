from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class PostType(str, Enum):
    general = "general"
    tip = "tip"
    success_story = "success_story"

class PostAuthor(BaseModel):
    name: str
    avatar: str
    location: str

class CommunityPostCreate(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=1, max_length=2000)
    post_type: PostType = PostType.general
    image_url: Optional[str] = None

class CommunityPostSchema(BaseModel):
    id: str
    title: Optional[str]
    content: str
    post_type: PostType
    image_url: Optional[str]
    author: PostAuthor
    likes_count: int
    comments_count: int
    created_at: datetime
    is_liked: Optional[bool] = False

    class Config:
        from_attributes = True

class CommunityPostList(BaseModel):
    posts: List[CommunityPostSchema]
    total: int
    page: int
    limit: int
    has_next: bool

class PostResponse(BaseModel):
    success: bool
    message: str
    post: Optional[CommunityPostSchema] = None

class LikeResponse(BaseModel):
    success: bool
    is_liked: bool
    likes_count: int

class ApiUser(BaseModel):
    id: str
    name: str
    username: str
    avatar: str
    location: str
    total_exchanges: int
    rating: float
    join_date: str

class CommunityStats(BaseModel):
    """Estadísticas generales de la comunidad"""
    total_users: int
    total_exchanges: int
    items_saved: int
    co2_reduced: float

class CommunityStatsResponse(BaseModel):
    """Respuesta de estadísticas de la comunidad"""
    total_users: int
    total_exchanges: int
    items_saved: int
    co2_reduced: float
    
    class Config:
        from_attributes = True

class TopUser(BaseModel):
    """Usuario destacado de la comunidad"""
    id: str
    name: str
    username: str
    avatar: str
    location: str
    total_exchanges: int
    rating: float
    join_date: str
    
    class Config:
        from_attributes = True

class TopUsersResponse(BaseModel):
    """Respuesta de usuarios destacados"""
    users: List[TopUser]
    total: int
    
    class Config:
        from_attributes = True

class CommunityPost(BaseModel):
    """Post de la comunidad"""
    id: str
    author: dict
    content: str
    image: Optional[str] = None
    likes: int
    comments: int
    created_at: str
    type: str
    
    class Config:
        from_attributes = True

class CommunityPostsResponse(BaseModel):
    """Respuesta de posts de la comunidad"""
    posts: List[CommunityPost]
    total: int
    
    class Config:
        from_attributes = True


class ActorType(str, Enum):
    user = "user"
    company = "company"


class MediaType(str, Enum):
    none = "none"
    image = "image"
    video = "video"


class FeedAuthor(BaseModel):
    id: str
    actor_type: ActorType
    name: str
    username: str
    avatar: str
    location: str


class FeedPostCreate(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=1, max_length=5000)
    post_type: PostType = PostType.general
    media_type: MediaType = MediaType.none
    media_url: Optional[str] = None


class FeedPost(BaseModel):
    id: str
    title: Optional[str]
    content: str
    post_type: PostType
    media_type: MediaType
    media_url: Optional[str]
    author: FeedAuthor
    likes_count: int
    comments_count: int
    shares_count: int
    created_at: datetime
    is_liked: bool = False


class FeedPostList(BaseModel):
    posts: List[FeedPost]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class FeedCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class FeedComment(BaseModel):
    id: str
    post_id: str
    author: FeedAuthor
    content: str
    created_at: datetime


class FeedCommentList(BaseModel):
    comments: List[FeedComment]
    total: int
    page: int
    page_size: int
    total_pages: int


class ToggleLikeResponse(BaseModel):
    liked: bool
    likes_count: int


class ShareResponse(BaseModel):
    shares_count: int
