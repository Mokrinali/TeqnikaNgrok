from datetime import datetime, date
from pydantic import BaseModel


# ── Auth ─────────────────────────────────────────────────────────────
class AuthRequest(BaseModel):
    code: str

class AuthResponse(BaseModel):
    token: str
    site_id: int | None
    site_name: str
    is_admin: bool


# ── Construction Site ─────────────────────────────────────────────────
class SiteBase(BaseModel):
    name: str
    code: str
    is_active: bool = True

class SiteCreate(SiteBase):
    pass

class SiteUpdate(SiteBase):
    pass

class SiteOut(SiteBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Contractor ────────────────────────────────────────────────────────
class ContractorBase(BaseModel):
    contractor_type: str
    contractor_mode: str = "დღიური"
    name: str
    id_code: str
    phone: str | None = None
    plate_number: str | None = None
    notes: str | None = None
    is_active: bool = True
    site_id: int

class ContractorCreate(ContractorBase):
    pass

class ContractorUpdate(ContractorBase):
    pass

class ContractorOut(ContractorBase):
    id: int
    created_at: datetime
    is_company: bool
    is_trip: bool
    is_both: bool
    required_code_length: int
    class Config:
        from_attributes = True


# ── Equipment ─────────────────────────────────────────────────────────
class EquipmentBase(BaseModel):
    name: str
    type: str | None = None
    plate_number: str | None = None
    daily_rate: float
    contractor_id: int
    is_active: bool = True
    notes: str | None = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(EquipmentBase):
    pass

class EquipmentOut(EquipmentBase):
    id: int
    created_at: datetime
    contractor: ContractorOut | None = None
    class Config:
        from_attributes = True


# ── Equipment Log ─────────────────────────────────────────────────────
class LogEntryCreate(BaseModel):
    equipment_id: int
    contractor_id: int
    verification_code: str
    photo_base64: str | None = None

class LogExitUpdate(BaseModel):
    log_id: int
    photo_base64: str | None = None

class LogUpdate(BaseModel):
    entry_timestamp: datetime
    exit_timestamp: datetime | None = None

class LogOut(BaseModel):
    id: int
    equipment_id: int
    equipment_name: str
    plate_number: str | None
    contractor_id: int
    contractor_name: str
    daily_rate: float
    entry_timestamp: datetime
    exit_timestamp: datetime | None
    entry_photo_url: str | None
    exit_photo_url: str | None
    verification_code: str
    created_at: datetime
    is_open: bool
    total_hours: float
    overtime_hours: float
    class Config:
        from_attributes = True


# ── Trip Log ──────────────────────────────────────────────────────────
class TripCreate(BaseModel):
    contractor_id: int
    work_type_id: int
    date: date
    trip_count: int
    price_per_trip: float
    notes: str | None = None

class TripUpdate(TripCreate):
    pass

class TripOut(BaseModel):
    id: int
    contractor_id: int
    contractor_name: str
    plate_number: str | None
    work_type_id: int
    work_type_name: str
    date: date
    trip_count: int
    price_per_trip: float
    total: float
    notes: str | None
    created_at: datetime
    class Config:
        from_attributes = True


# ── Work Type ─────────────────────────────────────────────────────────
class WorkTypeBase(BaseModel):
    name: str
    default_price: float = 0
    is_active: bool = True

class WorkTypeCreate(WorkTypeBase):
    pass

class WorkTypeUpdate(WorkTypeBase):
    pass

class WorkTypeOut(WorkTypeBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Kiosk ─────────────────────────────────────────────────────────────
class OpenEntryOut(BaseModel):
    id: int
    entry_timestamp: datetime
    entry_photo_url: str | None
    class Config:
        from_attributes = True

class EquipmentKioskItem(BaseModel):
    equipment: EquipmentOut
    open_entry: OpenEntryOut | None

class KioskContractorOut(BaseModel):
    contractor: ContractorOut
    equipment: list[EquipmentKioskItem]
    work_types: list[WorkTypeOut]
