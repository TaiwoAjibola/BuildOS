import { apiFetch } from './client';

export interface ActivityRecord {
    id: string;
    userId?: string;
    userName: string;
    action: string;
    module: string;
    description?: string;
    createdAt: string;
}

export interface CreateActivityRecordDto {
    userId?: string;
    userName: string;
    action: string;
    module: string;
    description?: string;
}

export function getActivityHistory(module?: string, userId?: string): Promise<ActivityRecord[]> {
    const params = new URLSearchParams();
    if (module) params.set('module', module);
    if (userId) params.set('userId', userId);
    const qs = params.toString();
    return apiFetch<ActivityRecord[]>(`/activity-history${qs ? `?${qs}` : ''}`);
}

export function getActivityRecord(id: string): Promise<ActivityRecord> {
    return apiFetch<ActivityRecord>(`/activity-history/${id}`);
}

export function createActivityRecord(dto: CreateActivityRecordDto): Promise<ActivityRecord> {
    return apiFetch<ActivityRecord>('/activity-history', { method: 'POST', body: JSON.stringify(dto) });
}

export function deleteActivityRecord(id: string): Promise<ActivityRecord> {
    return apiFetch<ActivityRecord>(`/activity-history/${id}`, { method: 'DELETE' });
}
