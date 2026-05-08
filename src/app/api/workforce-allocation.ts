import { apiFetch } from './client';

export interface WorkforceAllocation {
    id: string;
    employeeId?: string;
    employeeName: string;
    projectId?: string;
    projectName: string;
    role: string;
    allocPct: number;
    startDate: string;
    endDate?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkforceAllocationDto {
    employeeId?: string;
    employeeName: string;
    projectId?: string;
    projectName: string;
    role: string;
    allocPct?: number;
    startDate: string;
    endDate?: string;
    status?: string;
}

export function getWorkforceAllocations(employeeId?: string, projectId?: string): Promise<WorkforceAllocation[]> {
    const params = new URLSearchParams();
    if (employeeId) params.set('employeeId', employeeId);
    if (projectId) params.set('projectId', projectId);
    const qs = params.toString();
    return apiFetch<WorkforceAllocation[]>(`/workforce-allocation${qs ? `?${qs}` : ''}`);
}

export function getWorkforceAllocation(id: string): Promise<WorkforceAllocation> {
    return apiFetch<WorkforceAllocation>(`/workforce-allocation/${id}`);
}

export function createWorkforceAllocation(dto: CreateWorkforceAllocationDto): Promise<WorkforceAllocation> {
    return apiFetch<WorkforceAllocation>('/workforce-allocation', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateWorkforceAllocation(id: string, dto: Partial<CreateWorkforceAllocationDto>): Promise<WorkforceAllocation> {
    return apiFetch<WorkforceAllocation>(`/workforce-allocation/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function deleteWorkforceAllocation(id: string): Promise<WorkforceAllocation> {
    return apiFetch<WorkforceAllocation>(`/workforce-allocation/${id}`, { method: 'DELETE' });
}
