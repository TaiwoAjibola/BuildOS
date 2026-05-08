import { apiFetch } from './client';

export interface ProjectDocument {
    id: string; name: string; type: string; size?: number; url: string;
    uploadedBy?: string; folderName?: string; projectId?: string;
    tags?: string[]; createdAt: string;
}
export interface ConstructionApproval {
    id: string; type: string; reference: string; description?: string;
    projectId?: string; projectName?: string; status: string;
    requestedBy?: string; requestDate: string; reviewedBy?: string;
    reviewedAt?: string; notes?: string; createdAt: string;
}
export interface Timeline {
    id: string; name: string; projectId: string; projectName?: string;
    status: string; startDate: string; endDate: string; phases?: any[];
    createdAt: string;
}

// Project Documents
export const getProjectDocuments = (projectId?: string) =>
    apiFetch<ProjectDocument[]>(projectId ? `/project-documents?projectId=${projectId}` : '/project-documents');
export const getProjectDocument = (id: string) => apiFetch<ProjectDocument>(`/project-documents/${id}`);
export const createProjectDocument = (data: Partial<ProjectDocument>) =>
    apiFetch<ProjectDocument>('/project-documents', { method: 'POST', body: JSON.stringify(data) });
export const updateProjectDocument = (id: string, data: Partial<ProjectDocument>) =>
    apiFetch<ProjectDocument>(`/project-documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProjectDocument = (id: string) =>
    apiFetch<void>(`/project-documents/${id}`, { method: 'DELETE' });

// Construction Approvals
export const getConstructionApprovals = (status?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    const qs = params.toString();
    return apiFetch<ConstructionApproval[]>(qs ? `/construction-approvals?${qs}` : '/construction-approvals');
};
export const getConstructionApproval = (id: string) => apiFetch<ConstructionApproval>(`/construction-approvals/${id}`);
export const createConstructionApproval = (data: Partial<ConstructionApproval>) =>
    apiFetch<ConstructionApproval>('/construction-approvals', { method: 'POST', body: JSON.stringify(data) });
export const updateConstructionApproval = (id: string, data: Partial<ConstructionApproval>) =>
    apiFetch<ConstructionApproval>(`/construction-approvals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteConstructionApproval = (id: string) =>
    apiFetch<void>(`/construction-approvals/${id}`, { method: 'DELETE' });

// Timelines
export const getTimelines = (projectId?: string) =>
    apiFetch<Timeline[]>(projectId ? `/timelines?projectId=${projectId}` : '/timelines');
export const getTimeline = (id: string) => apiFetch<Timeline>(`/timelines/${id}`);
export const createTimeline = (data: Partial<Timeline>) =>
    apiFetch<Timeline>('/timelines', { method: 'POST', body: JSON.stringify(data) });
export const updateTimeline = (id: string, data: Partial<Timeline>) =>
    apiFetch<Timeline>(`/timelines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTimeline = (id: string) =>
    apiFetch<void>(`/timelines/${id}`, { method: 'DELETE' });
