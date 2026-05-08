import { apiFetch } from './client';

const statusMap: Record<string, string> = {
    UnderReview: 'Under Review',
};

function fmt(date: string | null) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapClaim(c: any) {
    return {
        id: c.id,
        employee: c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : '',
        department: c.employee?.department?.name ?? '',
        type: c.claimType?.name ?? c.type ?? '',
        amount: c.amount ?? 0,
        description: c.description ?? '',
        date: fmt(c.date ?? c.createdAt),
        status: statusMap[c.status] ?? c.status,
        reviewedBy: c.reviewedBy,
        reviewedAt: fmt(c.reviewedAt),
        rejectionReason: c.rejectionReason,
        paidAt: fmt(c.paidAt),
    };
}

export async function fetchClaims(params?: { status?: string; employeeId?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.employeeId) qs.set('employeeId', params.employeeId);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/claims${query}`);
    return data.map(mapClaim);
}
