from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100), unique=True, nullable=False)

    phone_number = Column(String(20), unique=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    # producer or consumer
    role = Column(String(20), nullable=False)

    # Account status
    is_active = Column(Boolean, default=True)