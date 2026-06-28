from datetime import datetime, date
from sqlalchemy import Integer, String, Boolean, Numeric, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class ConstructionSite(Base):
    __tablename__ = "construction_sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String(4), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    contractors: Mapped[list["Contractor"]] = relationship("Contractor", back_populates="site")


class Contractor(Base):
    __tablename__ = "contractors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contractor_type: Mapped[str] = mapped_column(String, nullable=False)
    contractor_mode: Mapped[str] = mapped_column(String, default="დღიური")
    name: Mapped[str] = mapped_column(String, nullable=False)
    id_code: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    plate_number: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    site_id: Mapped[int] = mapped_column(Integer, ForeignKey("construction_sites.id"), nullable=False, index=True)

    site: Mapped["ConstructionSite"] = relationship("ConstructionSite", back_populates="contractors")
    equipment: Mapped[list["Equipment"]] = relationship("Equipment", back_populates="contractor")

    @property
    def is_company(self) -> bool:
        return self.contractor_type == "შპს"

    @property
    def is_trip(self) -> bool:
        return self.contractor_mode == "რეისული"

    @property
    def is_both(self) -> bool:
        return self.contractor_mode == "ორივე"

    @property
    def required_code_length(self) -> int:
        return 9 if self.is_company else 11


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str | None] = mapped_column(String, nullable=True)
    plate_number: Mapped[str | None] = mapped_column(String, nullable=True)
    daily_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    contractor_id: Mapped[int] = mapped_column(Integer, ForeignKey("contractors.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    contractor: Mapped["Contractor"] = relationship("Contractor", back_populates="equipment")


class EquipmentLog(Base):
    __tablename__ = "equipment_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id"), nullable=False, index=True)
    equipment_name: Mapped[str] = mapped_column(String, nullable=False)
    plate_number: Mapped[str | None] = mapped_column(String, nullable=True)
    contractor_id: Mapped[int] = mapped_column(Integer, ForeignKey("contractors.id"), nullable=False, index=True)
    contractor_name: Mapped[str] = mapped_column(String, nullable=False)
    daily_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    entry_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    exit_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    entry_photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    exit_photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_code: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TripLog(Base):
    __tablename__ = "trip_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contractor_id: Mapped[int] = mapped_column(Integer, ForeignKey("contractors.id"), nullable=False, index=True)
    contractor_name: Mapped[str] = mapped_column(String, nullable=False)
    plate_number: Mapped[str | None] = mapped_column(String, nullable=True)
    work_type_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_types.id"), nullable=False)
    work_type_name: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    trip_count: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_trip: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WorkType(Base):
    __tablename__ = "work_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    default_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
