from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Float, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Rating(Base):
    __tablename__ = "ratings"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Participantes de la calificación
    rater_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    rated_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Intercambio relacionado
    exchange_id = Column(UUID(as_uuid=True), ForeignKey("exchanges.id"), nullable=False, index=True)
    
    # Calificación general (1-5 estrellas)
    overall_rating = Column(Float, nullable=False, index=True)
    
    # Calificaciones específicas (1-5 cada una)
    communication_rating = Column(Float, nullable=True)
    punctuality_rating = Column(Float, nullable=True)
    item_condition_rating = Column(Float, nullable=True)
    friendliness_rating = Column(Float, nullable=True)
    
    # Comentarios
    comment = Column(Text, nullable=True)
    
    # Recomendación
    would_exchange_again = Column(Integer, nullable=True)  # 1=Sí, 0=No, NULL=No especificado
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Constraints para validar rangos de calificación
    __table_args__ = (
        CheckConstraint('overall_rating >= 1 AND overall_rating <= 5', name='check_overall_rating_range'),
        CheckConstraint('communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)', name='check_communication_rating_range'),
        CheckConstraint('punctuality_rating IS NULL OR (punctuality_rating >= 1 AND punctuality_rating <= 5)', name='check_punctuality_rating_range'),
        CheckConstraint('item_condition_rating IS NULL OR (item_condition_rating >= 1 AND item_condition_rating <= 5)', name='check_item_condition_rating_range'),
        CheckConstraint('friendliness_rating IS NULL OR (friendliness_rating >= 1 AND friendliness_rating <= 5)', name='check_friendliness_rating_range'),
        CheckConstraint('would_exchange_again IS NULL OR would_exchange_again IN (0, 1)', name='check_would_exchange_again'),
        CheckConstraint('rater_id != rated_id', name='check_different_users'),
    )
    
    # Relaciones
    rater = relationship("User", foreign_keys=[rater_id], back_populates="given_ratings")
    rated = relationship("User", foreign_keys=[rated_id], back_populates="received_ratings")
    exchange = relationship("Exchange", back_populates="ratings")
    
    def __repr__(self):
        return f"<Rating(id={self.id}, rater_id={self.rater_id}, rated_id={self.rated_id}, rating={self.overall_rating})>"
    
    @property
    def overall_rating_stars(self) -> int:
        """Obtener la calificación general redondeada a estrellas enteras"""
        return round(self.overall_rating)
    
    @property
    def would_exchange_again_text(self) -> str:
        """Obtener el texto de recomendación"""
        if self.would_exchange_again == 1:
            return "Sí"
        elif self.would_exchange_again == 0:
            return "No"
        else:
            return "No especificado"
    
    @property
    def detailed_ratings(self) -> dict:
        """Obtener todas las calificaciones detalladas"""
        return {
            "communication": self.communication_rating,
            "punctuality": self.punctuality_rating,
            "item_condition": self.item_condition_rating,
            "friendliness": self.friendliness_rating
        }
    
    @property
    def average_detailed_rating(self) -> float:
        """Calcular el promedio de las calificaciones detalladas"""
        ratings = [r for r in self.detailed_ratings.values() if r is not None]
        if not ratings:
            return self.overall_rating
        return sum(ratings) / len(ratings)
    
    def can_be_accessed_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede acceder a esta calificación"""
        # Las calificaciones son públicas para los participantes del intercambio
        return user_id in [self.rater_id, self.rated_id]
    
    def can_be_edited_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede editar esta calificación"""
        # Solo el calificador puede editar su calificación
        return user_id == self.rater_id
    
    @classmethod
    def calculate_user_average_rating(cls, db_session, user_id: UUID) -> dict:
        """Calcular las calificaciones promedio de un usuario"""
        from sqlalchemy import func as sql_func
        
        result = db_session.query(
            sql_func.avg(cls.overall_rating).label('overall_avg'),
            sql_func.avg(cls.communication_rating).label('communication_avg'),
            sql_func.avg(cls.punctuality_rating).label('punctuality_avg'),
            sql_func.avg(cls.item_condition_rating).label('item_condition_avg'),
            sql_func.avg(cls.friendliness_rating).label('friendliness_avg'),
            sql_func.count(cls.id).label('total_ratings'),
            sql_func.sum(cls.would_exchange_again).label('positive_recommendations')
        ).filter(cls.rated_id == user_id).first()
        
        if result.total_ratings == 0:
            return {
                "overall_average": 0.0,
                "communication_average": 0.0,
                "punctuality_average": 0.0,
                "item_condition_average": 0.0,
                "friendliness_average": 0.0,
                "total_ratings": 0,
                "recommendation_rate": 0.0
            }
        
        recommendation_rate = 0.0
        if result.positive_recommendations:
            # Calcular solo entre los que especificaron recomendación
            total_with_recommendation = db_session.query(cls).filter(
                cls.rated_id == user_id,
                cls.would_exchange_again.isnot(None)
            ).count()
            if total_with_recommendation > 0:
                recommendation_rate = (result.positive_recommendations / total_with_recommendation) * 100
        
        return {
            "overall_average": round(float(result.overall_avg or 0), 2),
            "communication_average": round(float(result.communication_avg or 0), 2),
            "punctuality_average": round(float(result.punctuality_avg or 0), 2),
            "item_condition_average": round(float(result.item_condition_avg or 0), 2),
            "friendliness_average": round(float(result.friendliness_avg or 0), 2),
            "total_ratings": result.total_ratings,
            "recommendation_rate": round(recommendation_rate, 1)
        }
    
    @classmethod
    def get_user_ratings_distribution(cls, db_session, user_id: UUID) -> dict:
        """Obtener la distribución de calificaciones de un usuario"""
        from sqlalchemy import func as sql_func, case
        
        # Contar calificaciones por estrella (1-5)
        distribution = {}
        for stars in range(1, 6):
            count = db_session.query(cls).filter(
                cls.rated_id == user_id,
                sql_func.round(cls.overall_rating) == stars
            ).count()
            distribution[f"{stars}_stars"] = count
        
        return distribution
    
    @classmethod
    def user_has_rated_exchange(cls, db_session, user_id: UUID, exchange_id: UUID) -> bool:
        """Verificar si un usuario ya calificó un intercambio específico"""
        return db_session.query(cls).filter(
            cls.rater_id == user_id,
            cls.exchange_id == exchange_id
        ).first() is not None
    
    def to_dict(self, include_personal_info: bool = False) -> dict:
        """Convertir la calificación a diccionario para API"""
        result = {
            "id": str(self.id),
            "overall_rating": self.overall_rating,
            "overall_rating_stars": self.overall_rating_stars,
            "detailed_ratings": self.detailed_ratings,
            "comment": self.comment,
            "would_exchange_again": self.would_exchange_again_text,
            "created_at": self.created_at.isoformat()
        }
        
        if include_personal_info:
            result.update({
                "rater_id": str(self.rater_id),
                "rated_id": str(self.rated_id),
                "exchange_id": str(self.exchange_id)
            })
        
        return result
    
    @classmethod
    def create_rating(
        cls,
        rater_id: UUID,
        rated_id: UUID,
        exchange_id: UUID,
        overall_rating: float,
        comment: str = None,
        communication_rating: float = None,
        punctuality_rating: float = None,
        item_condition_rating: float = None,
        friendliness_rating: float = None,
        would_exchange_again: bool = None
    ):
        """Crear una nueva calificación con validaciones"""
        if rater_id == rated_id:
            raise ValueError("Un usuario no puede calificarse a sí mismo")
        
        if not (1 <= overall_rating <= 5):
            raise ValueError("La calificación general debe estar entre 1 y 5")
        
        would_exchange_again_int = None
        if would_exchange_again is not None:
            would_exchange_again_int = 1 if would_exchange_again else 0
        
        return cls(
            rater_id=rater_id,
            rated_id=rated_id,
            exchange_id=exchange_id,
            overall_rating=overall_rating,
            comment=comment,
            communication_rating=communication_rating,
            punctuality_rating=punctuality_rating,
            item_condition_rating=item_condition_rating,
            friendliness_rating=friendliness_rating,
            would_exchange_again=would_exchange_again_int
        )