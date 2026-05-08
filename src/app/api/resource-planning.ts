import { apiFetch } from './client';

export interface ResourcePlan {
    id: string;
    name: string;
    projectId?: string;
    projectName?: string;
    resourceType: string;
    quantity: number;
    unit?: string;
    startDate: string;
    endDate?: string;
    status: string;
    cost: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateResourcePlanDto {
    name: string;
    projectId?: string;
    projectName?: string;
    resourceType: string;
    quantity?: number;
    unit?: string;
    startDate: string;
    endDate?: string;
    status?: string;
    cost?: number;
    notes?: string;
}

export function getResourcePlans(projectId?: string): Promise<ResourcePlan[]> {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return apiFetch<ResourcePlan[]>(`/resource-planning${qs}`);
}

export function getResourcePlan(id: string): Promise<ResourcePlan> {
    return apiFetch<ResourcePlan>(`/resource-planning/${id}`);
}

export function createResourcePlan(dto: CreateResourcePlanDto): Promise<ResourcePlan> {
    return apiFetch<ResourcePlan>('/resource-planning', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateResourcePlan(id: string, dto: Partial<CreateResourcePlanDto>): Promise<ResourcePlan> {
    return apiFetch<ResourcePlan>(`/resource-planning/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function deleteResourcePlan(id: string): Promise<ResourcePlan> {
    return apiFetch<ResourcePlan>(`/resource-planning/${id}`, { method: 'DELETE' });
}
