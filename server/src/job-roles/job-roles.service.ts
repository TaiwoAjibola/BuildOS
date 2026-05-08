import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobRolesService {
    constructor(private prisma: PrismaService) { }

    findAll(department?: string) {
        return this.prisma.jobRole.findMany({
            where: department ? { department } : {},
            orderBy: { title: 'asc' },
        });
    }
    findOne(id: string) { return this.prisma.jobRole.findUnique({ where: { id } }); }
    create(data: any) { return this.prisma.jobRole.create({ data }); }
    update(id: string, data: any) { return this.prisma.jobRole.update({ where: { id }, data }); }
    remove(id: string) { return this.prisma.jobRole.delete({ where: { id } }); }
}
