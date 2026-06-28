import { api } from './client'
import type { Site } from '../types'

export const getSites = () => api.get<Site[]>('/sites/')
export const createSite = (data: Omit<Site, 'id' | 'created_at'>) => api.post<Site>('/sites/', data)
export const updateSite = (id: number, data: Omit<Site, 'id' | 'created_at'>) => api.put<Site>(`/sites/${id}`, data)
export const deleteSite = (id: number) => api.delete<void>(`/sites/${id}`)
