import { apiFetch } from './client';

const statusMap: Record<string, string> = {
    ApprovedRequest: 'Approved Request',
    SentToFinance: 'Sent to Finance',
    PaymentInitiated: 'Payment Initiated',
    PaymentCompleted: 'Payment Completed',
};

function fmt(date: string | null) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapPayment(p: any) {
    return {
        id: p.id,
        type: p.type,
        reference: p.reference ?? '',
        recipient: p.recipient ?? '',
        amount: p.amount ?? 0,
        method: p.method ?? '',
        bank: p.bank,
        date: fmt(p.date ?? p.createdAt),
        status: statusMap[p.status] ?? p.status,
        initiatedBy: p.initiatedBy,
        completedAt: fmt(p.completedAt),
        note: p.note,
    };
}

export async function fetchPayments(params?: { status?: string; type?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/payments${query}`);
    return data.map(mapPayment);
}
