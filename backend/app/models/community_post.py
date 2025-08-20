from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class PostType(str, enum.Enum):
    """Tipos de publicación en la comunidad"""
    SUCCESS_STORY = "success_story"  # Historia de éxito
    TIP = "tip"                      # Consejo o tip
    GENERAL = "general"              # Publicación general
    QUESTION = "question"            # Pregunta
    ANNOUNCEMENT = "announcement"    # Anuncio

class CommunityPost(Base):
    __tablename__ = "community_posts"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Contenido
    title = Column(String(200), nullable=True)  # Título opcional
    content = Column(Text, nullable=False)
    post_type = Column(Enum(PostType), default=PostType.GENERAL, nullable=False, index=True)
    
    # Multimedia
    image_url = Column(String(500), nullable=True)
    
    # Interacciones
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)  # Para posts destacados
    
    # Moderación
    is_approved = Column(Boolean, default=True, nullable=False)  # Para moderación futura
    moderated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    moderation_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    author = relationship("User", foreign_keys=[author_id], backref="community_posts")
    moderator = relationship("User", foreign_keys=[moderated_by])
    likes = relationship("CommunityPostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("CommunityPostComment", back_populates="post", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CommunityPost(id={self.id}, author_id={self.author_id}, type={self.post_type})>"
    
    @property
    def author_name(self):
        """Obtener el nombre completo del autor"""
        if self.author:
            return f"{self.author.first_name} {self.author.last_name}"
        return "Usuario desconocido"
    
    @property
    def author_avatar(self):
        """Obtener el avatar del autor"""
        if self.author and self.author.avatar_url:
            return self.author.avatar_url
        return "/api/placeholder/60/60"
    
    @property
    def author_location(self):
        """Obtener la ubicación del autor"""
        if self.author:
            location_parts = []
            if self.author.city:
                location_parts.append(self.author.city)
            if self.author.country:
                location_parts.append(self.author.country)
            return ", ".join(location_parts) if location_parts else "Ubicación no especificada"
        return "Ubicación no especificada"
    
    def increment_likes(self):
        """Incrementar el contador de likes"""
        self.likes_count += 1
    
    def decrement_likes(self):
        """Decrementar el contador de likes"""
        if self.likes_count > 0:
            self.likes_count -= 1
    
    def increment_comments(self):
        """Incrementar el contador de comentarios"""
        self.comments_count += 1
    
    def decrement_comments(self):
        """Decrementar el contador de comentarios"""
        if self.comments_count > 0:
            self.comments_count -= 1

class CommunityPostLike(Base):
    __tablename__ = "community_post_likes"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relaciones
    post = relationship("CommunityPost", back_populates="likes")
    user = relationship("User")
    
    def __repr__(self):
        return f"<CommunityPostLike(post_id={self.post_id}, user_id={self.user_id})>"

class CommunityPostComment(Base):
    __tablename__ = "community_post_comments"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Contenido
    content = Column(Text, nullable=False)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User")
    
    def __repr__(self):
        return f"<CommunityPostComment(id={self.id}, post_id={self.post_id}, author_id={self.author_id})>"
    
    @property
    def author_name(self):
        """Obtener el nombre completo del autor del comentario"""
        if self.author:
            return f"{self.author.first_name} {self.author.last_name}"
        return "Usuario desconocido"
    
    @property
    def author_avatar(self):
        """Obtener el avatar del autor del comentario"""
        if self.author and self.author.avatar_url:
            return self.author.avatar_url
        return "/api/placeholder/40/40"