export interface Site {
  id: number
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export interface Contractor {
  id: number
  contractor_type: string
  contractor_mode: string
  name: string
  id_code: string
  phone: string | null
  plate_number: string | null
  notes: string | null
  is_active: boolean
  site_id: number
  created_at: string
  is_company: boolean
  is_trip: boolean
  is_both: boolean
  required_code_length: number
}

export interface Equipment {
  id: number
  name: string
  type: string | null
  plate_number: string | null
  daily_rate: number
  contractor_id: number
  is_active: boolean
  notes: string | null
  created_at: string
  contractor: Contractor | null
}

export interface EquipmentLog {
  id: number
  equipment_id: number
  equipment_name: string
  plate_number: string | null
  contractor_id: number
  contractor_name: string
  daily_rate: number
  entry_timestamp: string
  exit_timestamp: string | null
  entry_photo_url: string | null
  exit_photo_url: string | null
  verification_code: string
  created_at: string
  is_open: boolean
  total_hours: number
  overtime_hours: number
}

export interface TripLog {
  id: number
  contractor_id: number
  contractor_name: string
  plate_number: string | null
  work_type_id: number
  work_type_name: string
  date: string
  trip_count: number
  price_per_trip: number
  total: number
  notes: string | null
  created_at: string
}

export interface WorkType {
  id: number
  name: string
  default_price: number
  is_active: boolean
  created_at: string
}

export interface Session {
  token: string
  siteId: number | null
  siteName: string
  isAdmin: boolean
}

export interface EquipmentKioskItem {
  equipment: Equipment
  open_entry: EquipmentLog | null
}
