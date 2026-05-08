import { apiFetch } from './client';

const statusMap: Record<string, string> = {
    Active: 'Active', Planning: 'Planning', OnHold: 'On Hold',
    Completed: 'Completed', Cancelled: 'Cancelled',
};

function fmt(date: string | null) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapProject(p: any) {
    return {
        id: p.id,
        name: p.name,
        client: p.client ?? '',
        location: p.location ?? '',
        state: p.state ?? '',
        city: p.city ?? '',
        status: statusMap[p.status] ?? p.status,
        type: p.type,
        budget: p.budget ?? 0,
        spent: p.spent ?? 0,
        progress: p.progress ?? 0,
        startDate: fmt(p.startDate),
        endDate: fmt(p.endDate),
        manager: p.manager ?? '',
        team: p.team ?? [],
    };
}

export async function fetchProjects(params?: { status?: string; type?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/projects${query}`);
    return data.map(mapProject);
}
