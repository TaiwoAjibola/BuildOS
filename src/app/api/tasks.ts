import { apiFetch } from './client';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignedTo?: string;
    projectId?: string;
    projectName?: string;
    dueDate?: string;
    tags: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    projectId?: string;
    projectName?: string;
    dueDate?: string;
    tags?: string[];
    createdBy?: string;
}

export function getTasks(status?: string, projectId?: string, assignedTo?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    if (assignedTo) params.set('assignedTo', assignedTo);
    const qs = params.toString();
    return apiFetch<Task[]>(`/tasks${qs ? `?${qs}` : ''}`);
}

export function getTask(id: string): Promise<Task> {
    return apiFetch<Task>(`/tasks/${id}`);
}

export function createTask(dto: CreateTaskDto): Promise<Task> {
    return apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateTask(id: string, dto: Partial<CreateTaskDto>): Promise<Task> {
    return apiFetch<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function deleteTask(id: string): Promise<Task> {
    return apiFetch<Task>(`/tasks/${id}`, { method: 'DELETE' });
}
