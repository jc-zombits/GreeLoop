from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Tokens
    access_token = Column(String(500), nullable=False, unique=True, index=True)
    refresh_token = Column(String(500), nullable=False, unique=True, index=True)
    
    # Información del dispositivo/navegador
    device_info = Column(Text, nullable=True)  # JSON string con info del dispositivo
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 puede ser hasta 45 caracteres
    
    # Información de ubicación (opcional)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Estado de la sesión
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, is_active={self.is_active})>"
    
    @property
    def is_expired(self) -> bool:
        """Verificar si la sesión ha expirado"""
        return datetime.now(timezone.utc) > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Verificar si la sesión es válida (activa, no revocada, no expirada)"""
        return self.is_active and not self.is_revoked and not self.is_expired
    
    @property
    def time_until_expiry(self) -> timedelta:
        """Obtener el tiempo restante hasta la expiración"""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - datetime.now(timezone.utc)
    
    @property
    def time_until_expiry_hours(self) -> int:
        """Obtener las horas restantes hasta la expiración"""
        time_left = self.time_until_expiry
        return max(0, int(time_left.total_seconds() // 3600))
    
    @property
    def device_name(self) -> str:
        """Obtener un nombre amigable del dispositivo"""
        if not self.user_agent:
            return "Dispositivo desconocido"
        
        user_agent = self.user_agent.lower()
        
        # Detectar tipo de dispositivo
        if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
            if 'android' in user_agent:
                return "Dispositivo Android"
            elif 'iphone' in user_agent or 'ipad' in user_agent:
                return "Dispositivo iOS"
            else:
                return "Dispositivo móvil"
        
        # Detectar navegador
        if 'chrome' in user_agent:
            return "Google Chrome"
        elif 'firefox' in user_agent:
            return "Mozilla Firefox"
        elif 'safari' in user_agent and 'chrome' not in user_agent:
            return "Safari"
        elif 'edge' in user_agent:
            return "Microsoft Edge"
        elif 'opera' in user_agent:
            return "Opera"
        
        return "Navegador web"
    
    @property
    def location_display(self) -> str:
        """Obtener la ubicación para mostrar"""
        if self.city and self.country:
            return f"{self.city}, {self.country}"
        elif self.country:
            return self.country
        elif self.ip_address:
            return f"IP: {self.ip_address}"
        else:
            return "Ubicación desconocida"
    
    def update_activity(self):
        """Actualizar la última actividad de la sesión"""
        self.last_activity = func.now()
    
    def revoke(self, reason: str = None):
        """Revocar la sesión"""
        self.is_active = False
        self.is_revoked = True
        self.revoked_at = func.now()
    
    def extend_expiry(self, days: int = 7):
        """Extender la fecha de expiración de la sesión"""
        if self.is_valid:
            self.expires_at = datetime.now(timezone.utc) + timedelta(days=days)
    
    @classmethod
    def create_session(
        cls,
        user_id: UUID,
        access_token: str,
        refresh_token: str,
        user_agent: str = None,
        ip_address: str = None,
        device_info: str = None,
        expires_in_days: int = 7
    ):
        """Crear una nueva sesión de usuario"""
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
        
        return cls(
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
            device_info=device_info,
            expires_at=expires_at
        )
    
    @classmethod
    def find_by_access_token(cls, db_session, access_token: str):
        """Buscar sesión por access token"""
        return db_session.query(cls).filter(
            cls.access_token == access_token,
            cls.is_active == True,
            cls.is_revoked == False
        ).first()
    
    @classmethod
    def find_by_refresh_token(cls, db_session, refresh_token: str):
        """Buscar sesión por refresh token"""
        return db_session.query(cls).filter(
            cls.refresh_token == refresh_token,
            cls.is_active == True,
            cls.is_revoked == False
        ).first()
    
    @classmethod
    def revoke_all_user_sessions(cls, db_session, user_id: UUID, except_session_id: UUID = None):
        """Revocar todas las sesiones de un usuario (excepto una específica)"""
        query = db_session.query(cls).filter(
            cls.user_id == user_id,
            cls.is_active == True
        )
        
        if except_session_id:
            query = query.filter(cls.id != except_session_id)
        
        query.update({
            "is_active": False,
            "is_revoked": True,
            "revoked_at": func.now()
        })
        
        db_session.commit()
    
    @classmethod
    def cleanup_expired_sessions(cls, db_session):
        """Limpiar sesiones expiradas"""
        expired_sessions = db_session.query(cls).filter(
            cls.expires_at < datetime.now(timezone.utc),
            cls.is_active == True
        )
        
        count = expired_sessions.count()
        
        expired_sessions.update({
            "is_active": False,
            "is_revoked": True,
            "revoked_at": func.now()
        })
        
        db_session.commit()
        return count
    
    @classmethod
    def get_user_active_sessions(cls, db_session, user_id: UUID):
        """Obtener todas las sesiones activas de un usuario"""
        return db_session.query(cls).filter(
            cls.user_id == user_id,
            cls.is_active == True,
            cls.is_revoked == False
        ).order_by(cls.last_activity.desc()).all()
    
    def to_dict(self, include_tokens: bool = False) -> dict:
        """Convertir la sesión a diccionario para API"""
        result = {
            "id": str(self.id),
            "device_name": self.device_name,
            "location": self.location_display,
            "ip_address": self.ip_address,
            "is_current": False,  # Se debe establecer externamente
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "is_expired": self.is_expired,
            "time_until_expiry_hours": int(self.time_until_expiry.total_seconds() / 3600)
        }
        
        if include_tokens:
            result.update({
                "access_token": self.access_token,
                "refresh_token": self.refresh_token
            })
        
        return result
    
    def get_security_info(self) -> dict:
        """Obtener información de seguridad de la sesión"""
        return {
            "session_id": str(self.id),
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "location": self.location_display,
            "device_name": self.device_name,
            "is_current_session": False,  # Se debe establecer externamente
            "suspicious_activity": self._detect_suspicious_activity()
        }
    
    def _detect_suspicious_activity(self) -> list:
        """Detectar actividad sospechosa en la sesión"""
        suspicious = []
        
        # Verificar si la sesión ha estado inactiva por mucho tiempo
        if self.last_activity:
            inactive_hours = (datetime.utcnow() - self.last_activity).total_seconds() / 3600
            if inactive_hours > 24 * 7:  # Más de una semana inactiva
                suspicious.append("Sesión inactiva por más de una semana")
        
        # Verificar ubicación inusual (esto requeriría lógica más compleja)
        # Por ahora, solo un placeholder
        
        return suspicious