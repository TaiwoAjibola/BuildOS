import { apiFetch } from './client';

export interface ReportRun {
    id: string;
    reportId: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    outputUrl?: string;
    errorMsg?: string;
    createdAt: string;
}

export interface ReportDefinition {
    id: string;
    name: string;
    type: string;
    module: string;
    description?: string;
    isScheduled: boolean;
    schedule?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    runs?: ReportRun[];
}

export interface CreateReportDto {
    name: string;
    type: string;
    module: string;
    description?: string;
    isScheduled?: boolean;
    schedule?: string;
    createdBy?: string;
}

export function getReports(module?: string): Promise<ReportDefinition[]> {
    const qs = module ? `?module=${encodeURIComponent(module)}` : '';
    return apiFetch<ReportDefinition[]>(`/reports${qs}`);
}

export function getReport(id: string): Promise<ReportDefinition> {
    return apiFetch<ReportDefinition>(`/reports/${id}`);
}

export function createReport(dto: CreateReportDto): Promise<ReportDefinition> {
    return apiFetch<ReportDefinition>('/reports', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateReport(id: string, dto: Partial<CreateReportDto>): Promise<ReportDefinition> {
    return apiFetch<ReportDefinition>(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function deleteReport(id: string): Promise<ReportDefinition> {
    return apiFetch<ReportDefinition>(`/reports/${id}`, { method: 'DELETE' });
}

export function runReport(id: string): Promise<ReportRun> {
    return apiFetch<ReportRun>(`/reports/${id}/run`, { method: 'POST' });
}

export function getReportRuns(id: string): Promise<ReportRun[]> {
    return apiFetch<ReportRun[]>(`/reports/${id}/runs`);
}
