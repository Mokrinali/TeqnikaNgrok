import { api } from './client'
import type { WorkType } from '../types'

export const getWorkTypes = () => api.get<WorkType[]>('/work-types/')
export const getActiveWorkTypes = () => api.get<WorkType[]>('/work-types/active')
export const createWorkType = (data: Partial<WorkType>) => api.post<WorkType>('/work-types/', data)
export const updateWorkType = (id: number, data: Partial<WorkType>) => api.put<WorkType>(`/work-types/${id}`, data)
export const deleteWorkType = (id: number) => api.delete<void>(`/work-types/${id}`)
