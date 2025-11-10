from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
class Base(DeclarativeBase):
    pass

class Excursion(Base):
    __tablename__ = "excursions"
    
    excursion_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title : Mapped[str] = mapped_column(String(200), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20),nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photos: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_per_person: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    accepted_payment_methods: Mapped[str] = mapped_column(String(50), default="online,cash")
    status: Mapped[str] = mapped_column(String(20), default="draft",nullable=False)
    available_slots: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    
    
      
    guide_id: Mapped[int] = mapped_column(Integer, ForeignKey("guides.guide_id"))  
    guide: Mapped["Guide"] = relationship(back_populates="excursions")   
    bookings: Mapped[list["Booking"]] = relationship(back_populates="excursion")  
    moderator_id: Mapped[int | None] = mapped_column(ForeignKey("moderators.moderator_id"),nullable=True)
    moderator: Mapped["Moderator"] = relationship(back_populates="moderated_excursions")
    reviews: Mapped[list["Review"]] = relationship(back_populates="excursion")
    
class Booking(Base):
    __tablename__ = "bookings"
    
    booking_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    number_of_people: Mapped[int] = mapped_column(Integer, nullable=False) 
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False) 
    excursion_id: Mapped[int] = mapped_column(Integer, ForeignKey("excursions.excursion_id"), nullable=False)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.client_id"), nullable=False)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"), nullable=False)
    
   
    excursion: Mapped["Excursion"] = relationship(back_populates="bookings")
    client: Mapped["Client"] = relationship(back_populates="bookings") 
    notifications: Mapped[list["Notification"]] = relationship(back_populates="booking")
    payment: Mapped["Payment"] = relationship(back_populates="booking")
    
    
class Moderator(Base):
    
    __tablename__ = "moderators"
    
    moderator_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    
    
    user: Mapped["User"] = relationship(back_populates="moderator_profile")
    moderated_excursions: Mapped[list["Excursion"]] = relationship(back_populates="moderator")
    

class User(Base):
    
    __tablename__ = "users"
    
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    
    moderator_profile: Mapped["Moderator"] = relationship(back_populates="user")
    guide_profile: Mapped["Guide"] = relationship(back_populates="user")
    client_profile: Mapped["Client"] = relationship(back_populates="user")
    
    
class Guide(Base):
    
    __tablename__ = "guides"
    
    
    guide_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    
    
    user: Mapped["User"] = relationship(back_populates="guide_profile")
    excursions: Mapped[list["Excursion"]] = relationship(back_populates="guide")
    statistics: Mapped["GuideStatistics"] = relationship(back_populates="guide")
    
    
class GuideStatistics(Base):
    __tablename__ = "guide_statistics"
    
    statistics_id: Mapped[int] = mapped_column(Integer,primary_key=True, autoincrement=True)
    guide_id: Mapped[int] = mapped_column(Integer, ForeignKey("guides.guide_id"), unique=True, nullable=False)
    total_excursions: Mapped[int] = mapped_column(Integer, default=0)
    total_clients: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0.0)
    
    guide: Mapped["Guide"] = relationship(back_populates="statistics")
    
    
    
class Client(Base):
    __tablename__ = "clients"
    
    client_id: Mapped[int] = mapped_column(Integer,primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), unique=True, nullable=False)
    
    
    user: Mapped["User"] = relationship(back_populates="client_profile") 
    bookings: Mapped[list["Booking"]] = relationship(back_populates="client")
    reviews: Mapped[list["Review"]] = relationship(back_populates="client")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="client")
    
    
class Payment(Base):
    __tablename__ = "payments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    
    booking: Mapped["Booking"] = relationship(back_populates="payment")
    
    
class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.booking_id"), nullable=True)
    receiver: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.client_id"), nullable=True)
    
    booking: Mapped["Booking"] = relationship(back_populates="notifications")
    client: Mapped["Client"] = relationship(back_populates="notifications")
    
    
class Review(Base):
    __tablename__ = "reviews"
    
    review_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.client_id"), nullable=False)
    excursion_id: Mapped[int] = mapped_column(ForeignKey("excursions.excursion_id"), nullable=False)
    
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    

    client: Mapped["Client"] = relationship(back_populates="reviews")
    excursion: Mapped["Excursion"] = relationship(back_populates="reviews")