import { api } from './client'
import type { Contractor } from '../types'

export const getContractors = () => api.get<Contractor[]>('/contractors/')
export const getContractorByCode = (code: string) => api.get<Contractor>(`/contractors/by-code/${code}`)
export const getContractorById = (id: number) => api.get<Contractor>(`/contractors/${id}`)
export const createContractor = (data: Partial<Contractor>) => api.post<Contractor>('/contractors/', data)
export const updateContractor = (id: number, data: Partial<Contractor>) => api.put<Contractor>(`/contractors/${id}`, data)
export const deleteContractor = (id: number) => api.delete<void>(`/contractors/${id}`)
