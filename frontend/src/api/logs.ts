import { api } from './client'
import type { EquipmentLog } from '../types'

export const getLogs = (params?: { from_dt?: string; to_dt?: string; contractor_id?: number; site_id?: number }) => {
  const qs = new URLSearchParams()
  if (params?.from_dt)      qs.set('from_dt', params.from_dt)
  if (params?.to_dt)        qs.set('to_dt', params.to_dt)
  if (params?.contractor_id) qs.set('contractor_id', String(params.contractor_id))
  if (params?.site_id)       qs.set('site_id', String(params.site_id))
  return api.get<EquipmentLog[]>(`/logs/?${qs.toString()}`)
}

export const getOpenEntry = (equipmentId: number) =>
  api.get<EquipmentLog | null>(`/logs/open/${equipmentId}`)

export const recordEntry = (data: {
  equipment_id: number
  contractor_id: number
  verification_code: string
  photo_base64?: string | null
}) => api.post<EquipmentLog>('/logs/entry', data)

export const recordExit = (data: {
  log_id: number
  photo_base64?: string | null
}) => api.post<EquipmentLog>('/logs/exit', data)

export const updateLog = (id: number, data: { entry_timestamp: string; exit_timestamp: string | null }) =>
  api.put<EquipmentLog>(`/logs/${id}`, data)

export const deleteLog = (id: number) => api.delete<void>(`/logs/${id}`)
