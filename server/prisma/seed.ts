import { PrismaClient, ProjectStatus, ProjectType, EmployeeStatus, EmploymentType, LeaveStatus, POStatus, POPaymentStatus, ExpenseStatus, IncomeStatus, BudgetScope, BudgetStatus, PaymentType, PaymentStatus, ClaimStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // ─── Departments ───
    const deptNames = ['Engineering', 'Operations', 'Finance', 'Human Resources', 'Procurement', 'Health & Safety', 'Administration', 'IT & Systems'];
    const deptData = [
        { name: 'Engineering', description: 'Structural and civil engineering teams', location: 'Floor 3, Main Office', budget: '₦45M / yr' },
        { name: 'Operations', description: 'Site operations, logistics and project execution', location: 'Floor 2, Main Office', budget: '₦38M / yr' },
        { name: 'Finance', description: 'Financial planning, budgeting and reporting', location: 'Floor 4, Main Office', budget: '₦28M / yr' },
        { name: 'Human Resources', description: 'Talent management, payroll and employee welfare', location: 'Floor 1, Main Office', budget: '₦22M / yr' },
        { name: 'Procurement', description: 'Supplier management and purchase orders', location: 'Floor 2, Main Office', budget: '₦18M / yr' },
        { name: 'Health & Safety', description: 'Site safety compliance and risk management', location: 'Floor 1, Main Office', budget: '₦15M / yr' },
        { name: 'Administration', description: 'Office administration and corporate services', location: 'Floor 1, Main Office', budget: '₦12M / yr' },
        { name: 'IT & Systems', description: 'Infrastructure, software and digital operations', location: 'Floor 5, Main Office', budget: '₦35M / yr' },
    ];

    const deptRecords: Record<string, any> = {};
    for (const d of deptData) {
        deptRecords[d.name] = await prisma.department.upsert({
            where: { name: d.name },
            update: {},
            create: d,
        });
    }

    // ─── Employees ───
    const empData = [
        { firstName: 'Chukwudi', lastName: 'Eze', role: 'Senior Civil Engineer', deptName: 'Engineering', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'c.eze@buildos.ng', phone: '+234 801 234 5001', dateHired: new Date('2022-03-15'), projectCount: 3, projects: ['Lekki Tower A', 'Airport Road Bridge', 'Mall Renovation'] },
        { firstName: 'Amaka', lastName: 'Osei', role: 'Project Manager', deptName: 'Operations', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'a.osei@buildos.ng', phone: '+234 802 345 6002', dateHired: new Date('2021-07-01'), projectCount: 2, projects: ['Mall Renovation', 'Riverside Residential'] },
        { firstName: 'Musa', lastName: 'Ibrahim', role: 'Procurement Officer', deptName: 'Procurement', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'm.ibrahim@buildos.ng', phone: '+234 803 456 7003', dateHired: new Date('2023-01-10'), projectCount: 1, projects: ['Industrial Warehouse'] },
        { firstName: 'Ngozi', lastName: 'Okafor', role: 'HR Manager', deptName: 'Human Resources', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'n.okafor@buildos.ng', phone: '+234 804 567 8004', dateHired: new Date('2020-05-20'), projectCount: 0, projects: [] },
        { firstName: 'Tunde', lastName: 'Bello', role: 'Site Safety Officer', deptName: 'Health & Safety', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 't.bello@buildos.ng', phone: '+234 805 678 9005', dateHired: new Date('2022-11-01'), projectCount: 2, projects: ['Lekki Tower A', 'Airport Road Bridge'] },
        { firstName: 'Sola', lastName: 'Adeleke', role: 'Finance Manager', deptName: 'Finance', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 's.adeleke@buildos.ng', phone: '+234 806 789 0006', dateHired: new Date('2019-09-15'), projectCount: 0, projects: [] },
        { firstName: 'Emeka', lastName: 'Nwosu', role: 'Structural Engineer', deptName: 'Engineering', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'e.nwosu@buildos.ng', phone: '+234 807 890 1007', dateHired: new Date('2023-03-01'), projectCount: 1, projects: ['Lekki Tower A'] },
        { firstName: 'Fatima', lastName: 'Al-Hassan', role: 'Site Engineer', deptName: 'Engineering', status: EmployeeStatus.on_leave, employmentType: EmploymentType.FullTime, email: 'f.alhassan@buildos.ng', phone: '+234 808 901 2008', dateHired: new Date('2024-01-15'), projectCount: 1, projects: ['Airport Road Bridge'] },
        { firstName: 'Yemi', lastName: 'Adesanya', role: 'QA/QC Inspector', deptName: 'Operations', status: EmployeeStatus.active, employmentType: EmploymentType.Contract, email: 'y.adesanya@buildos.ng', phone: '+234 809 012 3009', dateHired: new Date('2023-06-01'), projectCount: 2, projects: ['Riverside Residential', 'Industrial Warehouse'] },
        { firstName: 'Obinna', lastName: 'Okeke', role: 'IT Systems Administrator', deptName: 'IT & Systems', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'o.okeke@buildos.ng', phone: '+234 810 123 4010', dateHired: new Date('2022-08-10'), projectCount: 0, projects: [] },
        { firstName: 'Kemi', lastName: 'Adeyemi', role: 'Administrative Officer', deptName: 'Administration', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'k.adeyemi@buildos.ng', phone: '+234 811 234 5011', dateHired: new Date('2021-02-15'), projectCount: 0, projects: [] },
        { firstName: 'Abdullahi', lastName: 'Suleiman', role: 'Procurement Manager', deptName: 'Procurement', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'a.suleiman@buildos.ng', phone: '+234 812 345 6012', dateHired: new Date('2020-11-01'), projectCount: 0, projects: [] },
        { firstName: 'Chisom', lastName: 'Nwosu', role: 'Financial Analyst', deptName: 'Finance', status: EmployeeStatus.inactive, employmentType: EmploymentType.Contract, email: 'c.nwosu@buildos.ng', phone: '+234 813 456 7013', dateHired: new Date('2023-09-01'), projectCount: 0, projects: [] },
        { firstName: 'Hauwa', lastName: 'Musa', role: 'HSE Coordinator', deptName: 'Health & Safety', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'h.musa@buildos.ng', phone: '+234 814 567 8014', dateHired: new Date('2022-06-15'), projectCount: 3, projects: ['Mall Renovation', 'Industrial Warehouse', 'Riverside Residential'] },
        { firstName: 'Dayo', lastName: 'Ogundimu', role: 'Operations Manager', deptName: 'Operations', status: EmployeeStatus.active, employmentType: EmploymentType.FullTime, email: 'd.ogundimu@buildos.ng', phone: '+234 815 678 9015', dateHired: new Date('2019-04-01'), projectCount: 4, projects: ['Lekki Tower A', 'Mall Renovation', 'Airport Road Bridge', 'Industrial Warehouse'] },
    ];

    const empRecords: Record<string, any> = {};
    for (const e of empData) {
        const { deptName, ...rest } = e;
        const rec = await prisma.employee.upsert({
            where: { email: rest.email },
            update: {},
            create: {
                ...rest,
                departmentId: deptRecords[deptName]?.id,
            },
        });
        empRecords[`${rest.firstName} ${rest.lastName}`] = rec;
    }

    // Set department heads
    const headAssignments: Record<string, string> = {
        'Engineering': 'Chukwudi Eze',
        'Operations': 'Dayo Ogundimu',
        'Finance': 'Sola Adeleke',
        'Human Resources': 'Ngozi Okafor',
        'Procurement': 'Abdullahi Suleiman',
        'Health & Safety': 'Tunde Bello',
        'Administration': 'Kemi Adeyemi',
        'IT & Systems': 'Obinna Okeke',
    };
    for (const [deptName, empName] of Object.entries(headAssignments)) {
        const emp = empRecords[empName];
        if (emp && deptRecords[deptName]) {
            await prisma.department.update({
                where: { id: deptRecords[deptName].id },
                data: { headId: emp.id },
            });
        }
    }

    // ─── Projects ───
    const projectData = [
        { name: 'Lekki Tower A', client: 'Orbit Developments Ltd', location: 'Lekki Phase 1, Lagos', state: 'Lagos', city: 'Lagos', status: ProjectStatus.Active, type: ProjectType.Commercial, budget: 12500000, spent: 8125000, progress: 65, startDate: new Date('2025-01-15'), endDate: new Date('2026-12-31'), manager: 'Amaka Osei', teamSize: 24 },
        { name: 'Riverside Residential', client: 'ClearWater Properties', location: 'Trans-Amadi, PH', state: 'Rivers', city: 'Port Harcourt', status: ProjectStatus.Active, type: ProjectType.Residential, budget: 8200000, spent: 3444000, progress: 42, startDate: new Date('2025-03-01'), endDate: new Date('2026-09-30'), manager: 'Chukwudi Eze', teamSize: 18 },
        { name: 'Mall Renovation', client: 'Palms Shopping Ltd', location: 'Ikeja, Lagos', state: 'Lagos', city: 'Lagos', status: ProjectStatus.Active, type: ProjectType.Renovation, budget: 18400000, spent: 19320000, progress: 91, startDate: new Date('2024-09-01'), endDate: new Date('2026-06-30'), manager: 'Dayo Ogundimu', teamSize: 31 },
        { name: 'Industrial Warehouse', client: 'Dangote Logistics', location: 'Apapa, Lagos', state: 'Lagos', city: 'Lagos', status: ProjectStatus.Planning, type: ProjectType.Industrial, budget: 5800000, spent: 870000, progress: 15, startDate: new Date('2026-02-01'), endDate: new Date('2027-01-31'), manager: 'Musa Ibrahim', teamSize: 12 },
        { name: 'Airport Road Bridge', client: 'FMWH', location: 'Abuja-Kano Expressway', state: 'Abuja', city: 'Abuja', status: ProjectStatus.Active, type: ProjectType.Infrastructure, budget: 32000000, spent: 14400000, progress: 45, startDate: new Date('2025-06-01'), endDate: new Date('2027-05-31'), manager: 'Chukwudi Eze', teamSize: 42 },
        { name: 'GRA Estate Phase 2', client: 'Sunlight Homes Ltd', location: 'GRA, Enugu', state: 'Enugu', city: 'Enugu', status: ProjectStatus.Planning, type: ProjectType.Residential, budget: 6500000, spent: 325000, progress: 5, startDate: new Date('2026-04-01'), endDate: new Date('2027-10-31'), manager: 'Amaka Osei', teamSize: 8 },
        { name: 'Kano Office Complex', client: 'Hadeja Properties', location: 'Nassarawa GRA, Kano', state: 'Kano', city: 'Kano', status: ProjectStatus.OnHold, type: ProjectType.Commercial, budget: 9200000, spent: 460000, progress: 5, startDate: new Date('2025-11-01'), endDate: new Date('2027-02-28'), manager: 'Dayo Ogundimu', teamSize: 5 },
        { name: 'Abuja Civic Centre', client: 'FCT Authority', location: 'Central District, Abuja', state: 'Abuja', city: 'Abuja', status: ProjectStatus.Completed, type: ProjectType.Commercial, budget: 15000000, spent: 14700000, progress: 100, startDate: new Date('2023-01-01'), endDate: new Date('2025-12-31'), manager: 'Chukwudi Eze', teamSize: 35 },
    ];

    const projectRecords: Record<string, any> = {};
    for (const p of projectData) {
        const rec = await prisma.project.upsert({
            where: { id: p.name.replace(/\s+/g, '-').toLowerCase() },
            update: {},
            create: { ...p, id: p.name.replace(/\s+/g, '-').toLowerCase() },
        });
        projectRecords[p.name] = rec;
    }

    // ─── Leave Types ───
    const leaveTypes = [
        { name: 'Annual Leave', daysAllowed: 21, carryOver: true, maxCarryOver: 5, paid: true, approvalsRequired: 1, color: '#3B82F6', gender: 'All' },
        { name: 'Sick Leave', daysAllowed: 14, carryOver: false, maxCarryOver: 0, paid: true, approvalsRequired: 1, color: '#F59E0B', gender: 'All' },
        { name: 'Maternity Leave', daysAllowed: 90, carryOver: false, maxCarryOver: 0, paid: true, approvalsRequired: 2, color: '#EC4899', gender: 'Female' },
        { name: 'Paternity Leave', daysAllowed: 10, carryOver: false, maxCarryOver: 0, paid: true, approvalsRequired: 1, color: '#6366F1', gender: 'Male' },
        { name: 'Study Leave', daysAllowed: 10, carryOver: false, maxCarryOver: 0, paid: false, approvalsRequired: 2, color: '#8B5CF6', gender: 'All' },
        { name: 'Compassionate Leave', daysAllowed: 5, carryOver: false, maxCarryOver: 0, paid: true, approvalsRequired: 1, color: '#6B7280', gender: 'All' },
        { name: 'Unpaid Leave', daysAllowed: 30, carryOver: false, maxCarryOver: 0, paid: false, approvalsRequired: 2, color: '#9CA3AF', gender: 'All' },
    ];
    const ltRecords: Record<string, any> = {};
    for (const lt of leaveTypes) {
        ltRecords[lt.name] = await prisma.leaveType.upsert({
            where: { name: lt.name },
            update: {},
            create: lt,
        });
    }

    // ─── Claim Types ───
    const claimTypes = [
        { name: 'Medical', description: 'Hospital bills, prescriptions, and medical treatments', isProjectBased: false },
        { name: 'Travel', description: 'Business travel expenses including transport and accommodation', isProjectBased: true },
        { name: 'Meal Allowance', description: 'Meal expenses during business trips or overtime', isProjectBased: false },
        { name: 'Professional Development', description: 'Training, certifications, conferences and courses', isProjectBased: false },
        { name: 'Equipment', description: 'Tools and equipment purchased for project use', isProjectBased: true },
    ];
    const ctRecords: Record<string, any> = {};
    for (const ct of claimTypes) {
        ctRecords[ct.name] = await prisma.claimType.upsert({
            where: { name: ct.name },
            update: {},
            create: ct,
        });
    }

    // ─── Leave Requests ───
    const leaveRequests = [
        { refId: 'LV-2026-001', empName: 'Chukwudi Eze', ltName: 'Annual Leave', startDate: new Date('2026-04-14'), endDate: new Date('2026-04-25'), days: 10, status: LeaveStatus.approved, approvedBy: 'Ngozi Okafor', approvedAt: new Date('2026-04-10'), notes: 'Family vacation' },
        { refId: 'LV-2026-002', empName: 'Amaka Osei', ltName: 'Sick Leave', startDate: new Date('2026-04-08'), endDate: new Date('2026-04-10'), days: 3, status: LeaveStatus.approved, approvedBy: 'Ngozi Okafor', approvedAt: new Date('2026-04-08'), notes: 'Malaria treatment' },
        { refId: 'LV-2026-003', empName: 'Fatima Al-Hassan', ltName: 'Maternity Leave', startDate: new Date('2026-03-01'), endDate: new Date('2026-05-29'), days: 90, status: LeaveStatus.approved, approvedBy: 'Ngozi Okafor', approvedAt: new Date('2026-02-20'), notes: 'Maternity leave' },
        { refId: 'LV-2026-004', empName: 'Musa Ibrahim', ltName: 'Annual Leave', startDate: new Date('2026-04-21'), endDate: new Date('2026-04-25'), days: 5, status: LeaveStatus.pending, approvedBy: null, approvedAt: null, notes: 'Eid celebration' },
        { refId: 'LV-2026-005', empName: 'Tunde Bello', ltName: 'Study Leave', startDate: new Date('2026-05-05'), endDate: new Date('2026-05-09'), days: 5, status: LeaveStatus.pending, approvedBy: null, approvedAt: null, notes: 'NEBOSH exam preparation' },
        { refId: 'LV-2026-006', empName: 'Chisom Nwosu', ltName: 'Compassionate Leave', startDate: new Date('2026-04-05'), endDate: new Date('2026-04-07'), days: 3, status: LeaveStatus.approved, approvedBy: 'Ngozi Okafor', approvedAt: new Date('2026-04-04'), notes: 'Bereavement' },
        { refId: 'LV-2026-007', empName: 'Yemi Adesanya', ltName: 'Unpaid Leave', startDate: new Date('2026-04-28'), endDate: new Date('2026-05-02'), days: 5, status: LeaveStatus.rejected, approvedBy: 'Ngozi Okafor', approvedAt: new Date('2026-04-15'), notes: 'Personal reasons — rejected due to critical project phase' },
    ];
    for (const lr of leaveRequests) {
        const emp = empRecords[lr.empName];
        const lt = ltRecords[lr.ltName];
        if (!emp || !lt) continue;
        await prisma.leaveRequest.upsert({
            where: { refId: lr.refId },
            update: {},
            create: {
                refId: lr.refId,
                employeeId: emp.id,
                leaveTypeId: lt.id,
                startDate: lr.startDate,
                endDate: lr.endDate,
                days: lr.days,
                status: lr.status,
                approvedBy: lr.approvedBy,
                approvedAt: lr.approvedAt,
                notes: lr.notes,
                submittedAt: new Date(),
            },
        });
    }

    // ─── Suppliers ───
    const suppliersData = [
        {
            name: 'Dangote Cement PLC', contactPerson: 'Aliko Dangote Jr', phone: '+234 801 111 0001', email: 'supplies@dangote-cement.com', city: 'Lagos', categories: ['Concrete & Masonry', 'Aggregates'],
            rating: 4.8, onTimeDeliveryRate: 96, rejectRate: 1.2, totalSpend: 12500000, lastOrder: new Date('2026-04-10'), status: 'active', notes: 'Preferred cement supplier. Volume discounts above 500 bags.',
            materials: [{ name: 'OPC Cement', unit: 'bags', lastPrice: 8500 }, { name: 'Ready-mix Concrete', unit: 'm³', lastPrice: 45000 }],
        },
        {
            name: 'Lagos Steel Works Ltd', contactPerson: 'Emeka Okonkwo', phone: '+234 802 222 0002', email: 'sales@lagossteel.ng', city: 'Lagos', categories: ['Steel & Ironmongery'],
            rating: 4.5, onTimeDeliveryRate: 91, rejectRate: 2.1, totalSpend: 8900000, lastOrder: new Date('2026-04-08'), status: 'active', notes: 'Main structural steel supplier. Lead time 7–10 days.',
            materials: [{ name: 'Rebar Y16', unit: 'tonnes', lastPrice: 850000 }, { name: 'H-Beam 254x254', unit: 'metres', lastPrice: 28000 }],
        },
        {
            name: 'Buildtech MEP Ltd', contactPerson: 'Yetunde Fashola', phone: '+234 803 333 0003', email: 'procure@buildtechmep.ng', city: 'Lagos', categories: ['Electrical', 'Plumbing & MEP'],
            rating: 4.2, onTimeDeliveryRate: 88, rejectRate: 3.5, totalSpend: 5600000, lastOrder: new Date('2026-03-28'), status: 'active', notes: 'MEP systems contractor. Handles design & supply.',
            materials: [{ name: 'XLPE Cable 16mm²', unit: 'metres', lastPrice: 1800 }, { name: 'uPVC Pipe 110mm', unit: 'metres', lastPrice: 2200 }],
        },
        {
            name: 'Abuja Plumbing Supplies', contactPerson: 'Hassan Usman', phone: '+234 804 444 0004', email: 'orders@abujaплumbing.ng', city: 'Abuja', categories: ['Plumbing & MEP'],
            rating: 3.8, onTimeDeliveryRate: 82, rejectRate: 5.0, totalSpend: 2100000, lastOrder: new Date('2026-04-05'), status: 'active', notes: 'Regional plumbing supplier. Slower lead times for custom fittings.',
            materials: [{ name: 'PPR Pipe 25mm', unit: 'metres', lastPrice: 1500 }, { name: 'Gate Valve 4"', unit: 'units', lastPrice: 12000 }],
        },
        {
            name: 'Kano Timber & Board Co', contactPerson: 'Malam Sani Bello', phone: '+234 805 555 0005', email: 'kano.timber@gmail.com', city: 'Kano', categories: ['Timber & Formwork'],
            rating: 4.0, onTimeDeliveryRate: 85, rejectRate: 4.2, totalSpend: 3200000, lastOrder: new Date('2026-03-15'), status: 'active', notes: 'Good quality hardwood and plywood. Seasonal price variations.',
            materials: [{ name: 'Plywood 18mm', unit: 'sheets', lastPrice: 9500 }, { name: 'Hardwood Planks', unit: 'metres', lastPrice: 4200 }],
        },
    ];
    const supplierRecords: Record<string, any> = {};
    for (const s of suppliersData) {
        const { materials, ...rest } = s;
        const rec = await prisma.supplier.upsert({
            where: { id: s.name.replace(/\s+/g, '-').toLowerCase() },
            update: {},
            create: {
                ...rest,
                id: s.name.replace(/\s+/g, '-').toLowerCase(),
                materials: { create: materials },
            },
        });
        supplierRecords[s.name] = rec;
    }

    // ─── Purchase Orders ───
    const poData = [
        {
            id: 'PO-0027',
            supplierName: 'Dangote Cement PLC',
            prRef: 'PR-2026-0041',
            mrRef: 'MR-2026-0039',
            status: POStatus.partially_received,
            paymentStatus: POPaymentStatus.confirmation_requested,
            sentToFinance: true,
            financeRef: 'FIN-2026-0112',
            createdBy: 'Musa Ibrahim',
            expectedDate: new Date('2026-04-20'),
            items: [
                { material: 'OPC Cement (50kg bags)', qty: 500, unit: 'bags', unitCost: 8500, received: 300 },
                { material: 'Sharp Sand', qty: 20, unit: 'tonnes', unitCost: 22000, received: 20 },
            ],
        },
        {
            id: 'PO-0028',
            supplierName: 'Lagos Steel Works Ltd',
            prRef: 'PR-2026-0042',
            mrRef: null,
            status: POStatus.confirmed,
            paymentStatus: POPaymentStatus.unpaid,
            sentToFinance: false,
            financeRef: null,
            createdBy: 'Abdullahi Suleiman',
            expectedDate: new Date('2026-04-25'),
            items: [
                { material: 'Y16 Rebar', qty: 5, unit: 'tonnes', unitCost: 850000, received: 0 },
                { material: 'Y12 Rebar', qty: 3, unit: 'tonnes', unitCost: 780000, received: 0 },
            ],
        },
        {
            id: 'PO-0029',
            supplierName: 'Buildtech MEP Ltd',
            prRef: 'PR-2026-0040',
            mrRef: 'MR-2026-0038',
            status: POStatus.completed,
            paymentStatus: POPaymentStatus.paid,
            sentToFinance: true,
            financeRef: 'FIN-2026-0108',
            createdBy: 'Musa Ibrahim',
            expectedDate: new Date('2026-04-10'),
            items: [
                { material: 'XLPE Cable 16mm²', qty: 500, unit: 'metres', unitCost: 1800, received: 500 },
                { material: 'DB Boards 12-way', qty: 10, unit: 'units', unitCost: 45000, received: 10 },
            ],
        },
        {
            id: 'PO-0030',
            supplierName: 'Abuja Plumbing Supplies',
            prRef: null,
            mrRef: null,
            status: POStatus.sent,
            paymentStatus: POPaymentStatus.unpaid,
            sentToFinance: false,
            financeRef: null,
            createdBy: 'Musa Ibrahim',
            expectedDate: new Date('2026-04-30'),
            items: [
                { material: 'PPR Pipe 25mm', qty: 200, unit: 'metres', unitCost: 1500, received: 0 },
                { material: 'Gate Valve 4"', qty: 15, unit: 'units', unitCost: 12000, received: 0 },
            ],
        },
        {
            id: 'PO-0031',
            supplierName: 'Kano Timber & Board Co',
            prRef: 'PR-2026-0043',
            mrRef: null,
            status: POStatus.draft,
            paymentStatus: POPaymentStatus.unpaid,
            sentToFinance: false,
            financeRef: null,
            createdBy: 'Abdullahi Suleiman',
            expectedDate: new Date('2026-05-05'),
            items: [
                { material: 'Plywood 18mm', qty: 100, unit: 'sheets', unitCost: 9500, received: 0 },
                { material: 'Hardwood Shuttering Planks', qty: 50, unit: 'metres', unitCost: 4200, received: 0 },
            ],
        },
    ];
    for (const po of poData) {
        const { supplierName, items, ...rest } = po;
        const supplier = supplierRecords[supplierName];
        if (!supplier) continue;
        const totalValue = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
        const receivedValue = items.reduce((s, i) => s + i.received * i.unitCost, 0);
        await prisma.purchaseOrder.upsert({
            where: { id: rest.id },
            update: {},
            create: {
                ...rest,
                supplierId: supplier.id,
                totalValue,
                receivedValue,
                items: { create: items },
            },
        });
    }

    // ─── Expenses ───
    const expensesData = [
        { id: 'EXP-0051', projectName: 'Lekki Tower A', category: 'Materials', amount: 245000, description: 'Cement and reinforcement steel for floors 14–16', createdBy: 'Chukwudi Eze', date: new Date('2026-04-12'), status: ExpenseStatus.Submitted },
        { id: 'EXP-0050', projectName: 'Mall Renovation', category: 'Equipment', amount: 88000, description: 'Crane hire for structural steel installation', createdBy: 'Amaka Osei', date: new Date('2026-04-11'), status: ExpenseStatus.Approved, approvedBy: 'Sola Adeleke', approvedAt: new Date('2026-04-12T09:00:00') },
        { id: 'EXP-0049', projectName: 'Riverside Residential', category: 'Labour', amount: 62500, description: 'Overtime pay — April week 2', createdBy: 'Musa Ibrahim', date: new Date('2026-04-10'), status: ExpenseStatus.SentToFinance },
        { id: 'EXP-0048', projectName: 'Industrial Warehouse', category: 'Safety', amount: 18500, description: 'Hard hats, vests, and fall protection harnesses', createdBy: 'Ngozi Okafor', date: new Date('2026-04-09'), status: ExpenseStatus.Paid },
        { id: 'EXP-0047', projectName: 'Lekki Tower A', category: 'Transport', amount: 12000, description: 'Material delivery — Lagos to site', createdBy: 'Tunde Bello', date: new Date('2026-04-08'), status: ExpenseStatus.Rejected, rejectedBy: 'Sola Adeleke', rejectedAt: new Date('2026-04-09T14:00:00'), rejectionReason: 'Invoice missing supplier details' },
        { id: 'EXP-0046', projectName: 'Airport Road Bridge', category: 'Professional Fees', amount: 450000, description: 'Structural engineering consultancy — Phase 2', createdBy: 'Chukwudi Eze', date: new Date('2026-04-07'), status: ExpenseStatus.Draft },
        { id: 'EXP-0045', projectName: 'Mall Renovation', category: 'Maintenance', amount: 9200, description: 'Generator servicing and fuel top-up', createdBy: 'Musa Ibrahim', date: new Date('2026-04-06'), status: ExpenseStatus.Paid },
        { id: 'EXP-0044', projectName: 'Lekki Tower A', category: 'Materials', amount: 320000, description: 'Glass panels — curtain wall system', createdBy: 'Amaka Osei', date: new Date('2026-04-05'), status: ExpenseStatus.Approved, approvedBy: 'Sola Adeleke', approvedAt: new Date('2026-04-06T10:30:00') },
    ];
    for (const e of expensesData) {
        const { projectName, ...rest } = e;
        const project = projectRecords[projectName];
        await prisma.expense.upsert({
            where: { id: rest.id },
            update: {},
            create: { ...rest, projectId: project?.id },
        });
    }

    // ─── Income ───
    const incomeData = [
        { id: 'INC-0021', source: 'Contract Milestone', projectName: 'Lekki Tower A', amount: 1250000, description: 'Phase 2 completion milestone — floors 10–18', date: new Date('2026-04-12'), status: IncomeStatus.Received },
        { id: 'INC-0020', source: 'Client Payment', projectName: 'Mall Renovation', amount: 850000, description: 'Monthly progress payment — April', date: new Date('2026-04-10'), status: IncomeStatus.Received },
        { id: 'INC-0019', source: 'Contract Milestone', projectName: 'Riverside Residential', amount: 640000, description: 'Phase 1A handover — blocks A & B', date: new Date('2026-04-08'), status: IncomeStatus.Invoiced },
        { id: 'INC-0018', source: 'Subcontractor Recovery', projectName: 'Industrial Warehouse', amount: 42000, description: 'Back-charge for defective work — MEP contractor', date: new Date('2026-04-07'), status: IncomeStatus.Confirmed },
        { id: 'INC-0017', source: 'Insurance Claim', projectName: 'Airport Road Bridge', amount: 380000, description: 'Equipment damage claim — flood incident', date: new Date('2026-04-05'), status: IncomeStatus.Confirmed },
        { id: 'INC-0016', source: 'Contract Milestone', projectName: 'Lekki Tower A', amount: 975000, description: 'Phase 1 final milestone — structural complete', date: new Date('2026-04-03'), status: IncomeStatus.Received },
        { id: 'INC-0015', source: 'Government Grant', projectName: 'Airport Road Bridge', amount: 2000000, description: 'Federal infrastructure development grant — Q2 disbursement', date: new Date('2026-04-01'), status: IncomeStatus.Received },
        { id: 'INC-0014', source: 'Client Payment', projectName: 'Mall Renovation', amount: 420000, description: 'Advance payment — fitout phase', date: new Date('2026-03-28'), status: IncomeStatus.Draft },
    ];
    for (const i of incomeData) {
        const { projectName, ...rest } = i;
        const project = projectRecords[projectName];
        await prisma.income.upsert({
            where: { id: rest.id },
            update: {},
            create: { ...rest, projectId: project?.id },
        });
    }

    // ─── Budgets ───
    const budgetData = [
        { id: 'BUD-001', name: 'Lekki Tower A', scope: BudgetScope.Project, totalBudget: 12500000, spent: 8125000, committed: 1200000, period: 'FY2026', status: BudgetStatus.OnTrack, projectName: 'Lekki Tower A' },
        { id: 'BUD-002', name: 'Riverside Residential', scope: BudgetScope.Project, totalBudget: 8200000, spent: 3444000, committed: 580000, period: 'FY2026', status: BudgetStatus.OnTrack, projectName: 'Riverside Residential' },
        { id: 'BUD-003', name: 'Mall Renovation', scope: BudgetScope.Project, totalBudget: 18400000, spent: 19320000, committed: 0, period: 'FY2026', status: BudgetStatus.OverBudget, projectName: 'Mall Renovation' },
        { id: 'BUD-004', name: 'Industrial Warehouse', scope: BudgetScope.Project, totalBudget: 5800000, spent: 870000, committed: 200000, period: 'FY2026', status: BudgetStatus.Active, projectName: 'Industrial Warehouse' },
        { id: 'BUD-005', name: 'Airport Road Bridge', scope: BudgetScope.Project, totalBudget: 32000000, spent: 14400000, committed: 3000000, period: 'FY2026', status: BudgetStatus.OnTrack, projectName: 'Airport Road Bridge' },
        { id: 'BUD-006', name: 'Finance Department', scope: BudgetScope.Department, totalBudget: 2400000, spent: 1920000, committed: 120000, period: 'FY2026', status: BudgetStatus.AtRisk, projectName: null },
        { id: 'BUD-007', name: 'HR Department', scope: BudgetScope.Department, totalBudget: 1800000, spent: 960000, committed: 80000, period: 'FY2026', status: BudgetStatus.OnTrack, projectName: null },
        { id: 'BUD-008', name: 'IT Department', scope: BudgetScope.Department, totalBudget: 3200000, spent: 2880000, committed: 320000, period: 'FY2026', status: BudgetStatus.OverBudget, projectName: null },
    ];
    for (const b of budgetData) {
        const { projectName, ...rest } = b;
        const project = projectName ? projectRecords[projectName] : null;
        await prisma.budget.upsert({
            where: { id: rest.id },
            update: {},
            create: { ...rest, projectId: project?.id },
        });
    }

    // ─── Payments ───
    const paymentsData = [
        { id: 'PAY-0041', type: PaymentType.Contractor, reference: 'EXP-0049', recipient: 'Lagos Steel Works Ltd', amount: 620000, method: 'Bank Transfer', bank: 'Access Bank', date: new Date('2026-04-12'), status: PaymentStatus.PaymentCompleted, completedAt: new Date('2026-04-13T09:14:00') },
        { id: 'PAY-0040', type: PaymentType.Payroll, reference: 'PRLL-APR26', recipient: 'April 2026 Payroll', amount: 4850000, method: 'Bank Transfer', bank: 'GTBank', date: new Date('2026-04-10'), status: PaymentStatus.PaymentCompleted, completedAt: new Date('2026-04-10T17:00:00') },
        { id: 'PAY-0039', type: PaymentType.Expense, reference: 'EXP-0050', recipient: 'Amaka Osei', amount: 88000, method: 'Bank Transfer', bank: 'Zenith Bank', date: new Date('2026-04-11'), status: PaymentStatus.PaymentInitiated, initiatedBy: 'Sola Adeleke' },
        { id: 'PAY-0038', type: PaymentType.Vendor, reference: 'PO-2026-0044', recipient: 'Dangote Cement PLC', amount: 245000, method: 'Bank Transfer', bank: 'First Bank', date: new Date('2026-04-09'), status: PaymentStatus.SentToFinance },
        { id: 'PAY-0037', type: PaymentType.Expense, reference: 'EXP-0051', recipient: 'Chukwudi Eze', amount: 62500, method: 'Mobile Payment', date: new Date('2026-04-12'), status: PaymentStatus.ApprovedRequest },
        { id: 'PAY-0036', type: PaymentType.Contractor, reference: 'CON-2026-018', recipient: 'Buildtech MEP Ltd', amount: 1800000, method: 'Bank Transfer', bank: 'UBA', date: new Date('2026-04-07'), status: PaymentStatus.PaymentCompleted, completedAt: new Date('2026-04-08T11:30:00') },
        { id: 'PAY-0035', type: PaymentType.Vendor, reference: 'PO-2026-0041', recipient: 'Abuja Plumbing Supplies', amount: 95000, method: 'Cheque', date: new Date('2026-04-05'), status: PaymentStatus.Failed, note: 'Cheque returned — incorrect bank details' },
    ];
    for (const p of paymentsData) {
        await prisma.payment.upsert({
            where: { id: p.id },
            update: {},
            create: p,
        });
    }

    // ─── Claims ───
    const claimsData = [
        { id: 'CLM-0031', empName: 'Tunde Bello', ctName: 'Medical', amount: 45000, description: 'Hospital bill — emergency appendectomy', date: new Date('2026-04-11'), status: ClaimStatus.UnderReview },
        { id: 'CLM-0030', empName: 'Ngozi Okafor', ctName: 'Professional Development', amount: 120000, description: 'CIPD conference attendance & registration fee', date: new Date('2026-04-10'), status: ClaimStatus.Approved, reviewedBy: 'Sola Adeleke', reviewedAt: new Date('2026-04-11') },
        { id: 'CLM-0029', empName: 'Musa Ibrahim', ctName: 'Travel', amount: 28500, description: 'Lagos–Abuja business trip — vendor inspection', date: new Date('2026-04-09'), status: ClaimStatus.Paid, paidAt: new Date('2026-04-12') },
        { id: 'CLM-0028', empName: 'Chukwudi Eze', ctName: 'Equipment', amount: 65000, description: 'Personal laptop for site documentation', date: new Date('2026-04-08'), status: ClaimStatus.Submitted },
        { id: 'CLM-0027', empName: 'Amaka Osei', ctName: 'Travel', amount: 18000, description: 'PH–Lagos flight for client meeting', date: new Date('2026-04-07'), status: ClaimStatus.Approved, reviewedBy: 'Sola Adeleke', reviewedAt: new Date('2026-04-08') },
    ];
    for (const c of claimsData) {
        const emp = empRecords[c.empName];
        const ct = ctRecords[c.ctName];
        if (!emp || !ct) continue;
        await prisma.claim.upsert({
            where: { id: c.id },
            update: {},
            create: {
                id: c.id,
                amount: c.amount,
                description: c.description,
                date: c.date,
                status: c.status,
                reviewedBy: c.reviewedBy,
                reviewedAt: c.reviewedAt,
                paidAt: c.paidAt,
                employeeId: emp.id,
                claimTypeId: ct.id,
            },
        });
    }

    console.log('Seed completed successfully!');

    // ─── Default Admin User ───
    const hashedPassword = await bcrypt.hash('BuildOS@2025', 10);
    await prisma.user.upsert({
        where: { email: 'admin@buildos.ng' },
        update: {},
        create: {
            email: 'admin@buildos.ng',
            password: hashedPassword,
            name: 'Admin User',
            role: UserRole.admin,
        },
    });
    console.log('Admin user created: admin@buildos.ng');
}
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
