import { api } from './client'
import type { Equipment } from '../types'

export const getEquipment = () => api.get<Equipment[]>('/equipment/')
export const getEquipmentByContractor = (contractorId: number) => api.get<Equipment[]>(`/equipment/by-contractor/${contractorId}`)
export const getEquipmentById = (id: number) => api.get<Equipment>(`/equipment/${id}`)
export const createEquipment = (data: Partial<Equipment>) => api.post<Equipment>('/equipment/', data)
export const updateEquipment = (id: number, data: Partial<Equipment>) => api.put<Equipment>(`/equipment/${id}`, data)
export const deleteEquipment = (id: number) => api.delete<void>(`/equipment/${id}`)
