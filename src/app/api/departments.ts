import { apiFetch } from './client';

function mapDepartment(d: any) {
    return {
        id: d.id,
        name: d.name,
        head: d.head ? `${d.head.firstName} ${d.head.lastName}` : '',
        headId: d.headId,
        description: d.description ?? '',
        headcount: d.employees?.length ?? 0,
        budget: d.budget ?? 0,
        location: d.location ?? '',
        employees: (d.employees ?? []).map((e: any) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
            role: e.role,
        })),
    };
}

export async function fetchDepartments() {
    const data = await apiFetch<any[]>('/departments');
    return data.map(mapDepartment);
}
