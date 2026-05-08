import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    findAll(module?: string) {
        return this.prisma.reportDefinition.findMany({
            where: module ? { module } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id: string) {
        return this.prisma.reportDefinition.findUnique({ where: { id }, include: { runs: true } });
    }
    create(data: any) { return this.prisma.reportDefinition.create({ data }); }
    update(id: string, data: any) { return this.prisma.reportDefinition.update({ where: { id }, data }); }
    remove(id: string) { return this.prisma.reportDefinition.delete({ where: { id } }); }

    async runReport(id: string) {
        const run = await this.prisma.reportRun.create({
            data: { reportId: id, status: 'running' },
        });
        // Mark complete immediately (actual execution can be extended later)
        return this.prisma.reportRun.update({
            where: { id: run.id },
            data: { status: 'completed', completedAt: new Date() },
        });
    }
    getRunsForReport(reportId: string) {
        return this.prisma.reportRun.findMany({
            where: { reportId },
            orderBy: { startedAt: 'desc' },
        });
    }
}
