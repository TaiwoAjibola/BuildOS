import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.department.findMany({
            include: {
                head: true,
                employees: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    findOne(id: string) {
        return this.prisma.department.findUniqueOrThrow({
            where: { id },
            include: { head: true, employees: true },
        });
    }

    create(data: any) {
        return this.prisma.department.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.department.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.department.delete({ where: { id } });
    }
}
