import { apiFetch } from './client';

const statusMap: Record<string, string> = {
    SentToFinance: 'Sent to Finance',
};

function fmt(date: string | null) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapExpense(e: any) {
    return {
        id: e.id,
        project: e.project?.name ?? '',
        category: e.category ?? '',
        amount: e.amount ?? 0,
        description: e.description ?? '',
        createdBy: e.createdBy ?? '',
        date: fmt(e.date ?? e.createdAt),
        status: statusMap[e.status] ?? e.status,
        receipt: e.receipt,
        approvedBy: e.approvedBy,
        approvedAt: fmt(e.approvedAt),
        rejectedBy: e.rejectedBy,
        rejectedAt: fmt(e.rejectedAt),
        rejectionReason: e.rejectionReason,
    };
}

export async function fetchExpenses(params?: { status?: string; projectId?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.projectId) qs.set('projectId', params.projectId);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/expenses${query}`);
    return data.map(mapExpense);
}
