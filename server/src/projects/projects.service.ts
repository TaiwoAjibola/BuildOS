import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, type?: string) {
        return this.prisma.project.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(type ? { type: type as any } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.project.findUniqueOrThrow({ where: { id } });
    }

    create(data: any) {
        return this.prisma.project.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.project.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.project.delete({ where: { id } });
    }
}
