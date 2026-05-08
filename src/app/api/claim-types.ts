import { apiFetch } from './client';

export interface ClaimType {
    id: string;
    name: string;
    description: string;
    isProjectBased: boolean;
}

export const fetchClaimTypes = () => apiFetch<ClaimType[]>('/claim-types');
export const createClaimType = (data: Omit<ClaimType, 'id'>) =>
    apiFetch<ClaimType>('/claim-types', { method: 'POST', body: JSON.stringify(data) });
export const updateClaimType = (id: string, data: Partial<Omit<ClaimType, 'id'>>) =>
    apiFetch<ClaimType>(`/claim-types/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClaimType = (id: string) =>
    apiFetch<void>(`/claim-types/${id}`, { method: 'DELETE' });
