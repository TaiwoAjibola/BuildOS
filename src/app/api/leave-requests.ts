import { apiFetch } from './client';

function fmt(date: string | null) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapLeaveRequest(r: any) {
    return {
        id: r.id,
        refId: r.refId ?? r.id,
        employee: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '',
        department: r.employee?.department?.name ?? '',
        leaveType: r.leaveType?.name ?? '',
        startDate: fmt(r.startDate),
        endDate: fmt(r.endDate),
        days: r.days,
        status: r.status,
        submittedAt: fmt(r.submittedAt ?? r.createdAt),
        approvedBy: r.approvedBy ?? '',
        approvedAt: fmt(r.approvedAt),
        notes: r.notes ?? '',
    };
}

export async function fetchLeaveRequests(params?: { status?: string; employeeId?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.employeeId) qs.set('employeeId', params.employeeId);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/leave-requests${query}`);
    return data.map(mapLeaveRequest);
}
