from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuración visual
    icon = Column(String(100), nullable=True)  # Nombre del icono (ej: "electronics", "books")
    color = Column(String(7), nullable=True)   # Color hexadecimal (ej: "#FF5722")
    image_url = Column(String(500), nullable=True)
    
    # Estado y orden
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Estadísticas
    items_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    items = relationship("Item", back_populates="category")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name}, slug={self.slug})>"
    
    @classmethod
    def get_default_categories(cls):
        """Obtener las categorías por defecto para inicializar la base de datos"""
        return [
            {
                "name": "Electrónicos",
                "slug": "electronics",
                "description": "Dispositivos electrónicos, gadgets, computadoras, teléfonos",
                "icon": "smartphone",
                "color": "#2196F3",
                "sort_order": 1
            },
            {
                "name": "Libros y Educación",
                "slug": "books-education",
                "description": "Libros, material educativo, cursos, revistas",
                "icon": "book",
                "color": "#4CAF50",
                "sort_order": 2
            },
            {
                "name": "Ropa y Accesorios",
                "slug": "clothing-accessories",
                "description": "Ropa, zapatos, bolsos, joyería, accesorios",
                "icon": "shirt",
                "color": "#E91E63",
                "sort_order": 3
            },
            {
                "name": "Hogar y Jardín",
                "slug": "home-garden",
                "description": "Muebles, decoración, herramientas, plantas, jardinería",
                "icon": "home",
                "color": "#FF9800",
                "sort_order": 4
            },
            {
                "name": "Deportes y Recreación",
                "slug": "sports-recreation",
                "description": "Equipos deportivos, juegos, instrumentos musicales",
                "icon": "sports",
                "color": "#FF5722",
                "sort_order": 5
            },
            {
                "name": "Vehículos y Transporte",
                "slug": "vehicles-transport",
                "description": "Bicicletas, patinetes, accesorios para vehículos",
                "icon": "directions_bike",
                "color": "#607D8B",
                "sort_order": 6
            },
            {
                "name": "Arte y Manualidades",
                "slug": "arts-crafts",
                "description": "Materiales de arte, manualidades, obras de arte",
                "icon": "palette",
                "color": "#9C27B0",
                "sort_order": 7
            },
            {
                "name": "Bebés y Niños",
                "slug": "baby-kids",
                "description": "Ropa infantil, juguetes, artículos para bebés",
                "icon": "child_care",
                "color": "#FFEB3B",
                "sort_order": 8
            },
            {
                "name": "Salud y Belleza",
                "slug": "health-beauty",
                "description": "Productos de cuidado personal, cosméticos, suplementos",
                "icon": "spa",
                "color": "#00BCD4",
                "sort_order": 9
            },
            {
                "name": "Otros",
                "slug": "others",
                "description": "Artículos que no encajan en otras categorías",
                "icon": "category",
                "color": "#9E9E9E",
                "sort_order": 10
            }
        ]
    
    async def update_items_count(self, db_session):
        """Actualizar el contador de items en esta categoría"""
        from app.models.item import Item
        from sqlalchemy import select, func
        
        query = select(func.count(Item.id)).filter(
            Item.category_id == self.id,
            Item.is_active == True
        )
        result = await db_session.execute(query)
        self.items_count = result.scalar()