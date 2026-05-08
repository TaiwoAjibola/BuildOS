import { apiFetch } from './client';

export interface ComplianceDocumentType {
    id: string;
    name: string;
    description?: string;
    level: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateComplianceDocumentTypeDto {
    name: string;
    description?: string;
    level?: string;
}

export function getComplianceDocuments(level?: string): Promise<ComplianceDocumentType[]> {
    const qs = level ? `?level=${encodeURIComponent(level)}` : '';
    return apiFetch<ComplianceDocumentType[]>(`/compliance-documents${qs}`);
}

export function getComplianceDocument(id: string): Promise<ComplianceDocumentType> {
    return apiFetch<ComplianceDocumentType>(`/compliance-documents/${id}`);
}

export function createComplianceDocument(dto: CreateComplianceDocumentTypeDto): Promise<ComplianceDocumentType> {
    return apiFetch<ComplianceDocumentType>('/compliance-documents', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateComplianceDocument(id: string, dto: Partial<CreateComplianceDocumentTypeDto>): Promise<ComplianceDocumentType> {
    return apiFetch<ComplianceDocumentType>(`/compliance-documents/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function deleteComplianceDocument(id: string): Promise<ComplianceDocumentType> {
    return apiFetch<ComplianceDocumentType>(`/compliance-documents/${id}`, { method: 'DELETE' });
}
