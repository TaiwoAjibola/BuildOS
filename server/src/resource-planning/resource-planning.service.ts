import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcePlanningService {
    constructor(private prisma: PrismaService) { }

    findAll(projectId?: string) {
        return this.prisma.resourcePlan.findMany({
            where: projectId ? { projectId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id: string) { return this.prisma.resourcePlan.findUnique({ where: { id } }); }
    create(data: any) { return this.prisma.resourcePlan.create({ data }); }
    update(id: string, data: any) { return this.prisma.resourcePlan.update({ where: { id }, data }); }
    remove(id: string) { return this.prisma.resourcePlan.delete({ where: { id } }); }
}
