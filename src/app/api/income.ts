import { apiFetch } from './client';

function fmt(date: string | null) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapIncome(i: any) {
    return {
        id: i.id,
        source: i.source ?? '',
        project: i.project?.name ?? '',
        amount: i.amount ?? 0,
        description: i.description ?? '',
        date: fmt(i.date ?? i.createdAt),
        status: i.status,
        receivedBy: i.receivedBy,
    };
}

export async function fetchIncome(params?: { status?: string; projectId?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.projectId) qs.set('projectId', params.projectId);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/income${query}`);
    return data.map(mapIncome);
}
