import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkforceAllocationService {
    constructor(private prisma: PrismaService) { }

    findAll(employeeId?: string, projectId?: string) {
        return this.prisma.workforceAllocation.findMany({
            where: {
                ...(employeeId ? { employeeId } : {}),
                ...(projectId ? { projectId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id: string) { return this.prisma.workforceAllocation.findUnique({ where: { id } }); }
    create(data: any) { return this.prisma.workforceAllocation.create({ data }); }
    update(id: string, data: any) { return this.prisma.workforceAllocation.update({ where: { id }, data }); }
    remove(id: string) { return this.prisma.workforceAllocation.delete({ where: { id } }); }
}
