import { apiFetch } from './client';

function mapSupplier(s: any) {
    return {
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson ?? '',
        phone: s.phone ?? '',
        email: s.email ?? '',
        city: s.city ?? '',
        category: s.category ?? [],
        rating: s.rating ?? 0,
        onTimeDeliveryRate: s.onTimeDeliveryRate ?? 0,
        rejectRate: s.rejectRate ?? 0,
        activePOs: s.activePOs ?? 0,
        totalSpend: s.totalSpend ?? 0,
        lastOrder: s.lastOrder ?? '',
        status: s.status ?? 'active',
        materials: (s.materials ?? []).map((m: any) => ({
            name: m.name,
            unit: m.unit,
            lastPrice: m.lastPrice ?? 0,
        })),
        notes: s.notes ?? '',
    };
}

export async function fetchSuppliers() {
    const data = await apiFetch<any[]>('/suppliers');
    return data.map(mapSupplier);
}
