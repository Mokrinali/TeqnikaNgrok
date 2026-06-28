import { api } from './client'
import type { TripLog, Contractor } from '../types'

export const getTrips = (params?: { from_dt?: string; to_dt?: string; contractor_id?: number; site_id?: number }) => {
  const qs = new URLSearchParams()
  if (params?.from_dt)       qs.set('from_dt', params.from_dt)
  if (params?.to_dt)         qs.set('to_dt', params.to_dt)
  if (params?.contractor_id) qs.set('contractor_id', String(params.contractor_id))
  if (params?.site_id)       qs.set('site_id', String(params.site_id))
  return api.get<TripLog[]>(`/trips/?${qs.toString()}`)
}

export const getActiveTripContractors = () => api.get<Contractor[]>('/trips/contractors/active')
export const createTrip = (data: Partial<TripLog>) => api.post<TripLog>('/trips/', data)
export const updateTrip = (id: number, data: Partial<TripLog>) => api.put<TripLog>(`/trips/${id}`, data)
export const deleteTrip = (id: number) => api.delete<void>(`/trips/${id}`)
