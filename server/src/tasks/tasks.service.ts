import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, projectId?: string, assignedTo?: string) {
        return this.prisma.task.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(projectId ? { projectId } : {}),
                ...(assignedTo ? { assignedTo } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id: string) { return this.prisma.task.findUnique({ where: { id } }); }
    create(data: any) { return this.prisma.task.create({ data }); }
    update(id: string, data: any) { return this.prisma.task.update({ where: { id }, data }); }
    remove(id: string) { return this.prisma.task.delete({ where: { id } }); }
}
