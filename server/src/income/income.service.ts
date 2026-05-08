import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncomeService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, projectId?: string) {
        return this.prisma.income.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(projectId ? { projectId } : {}),
            },
            include: { project: true },
            orderBy: { date: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.income.findUniqueOrThrow({
            where: { id },
            include: { project: true },
        });
    }

    create(data: any) {
        return this.prisma.income.create({ data, include: { project: true } });
    }

    update(id: string, data: any) {
        return this.prisma.income.update({ where: { id }, data, include: { project: true } });
    }

    remove(id: string) {
        return this.prisma.income.delete({ where: { id } });
    }
}
