import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, departmentId?: string) {
        return this.prisma.employee.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(departmentId ? { departmentId } : {}),
            },
            include: { department: true },
            orderBy: { firstName: 'asc' },
        });
    }

    findOne(id: string) {
        return this.prisma.employee.findUniqueOrThrow({
            where: { id },
            include: { department: true },
        });
    }

    create(data: any) {
        return this.prisma.employee.create({ data, include: { department: true } });
    }

    update(id: string, data: any) {
        return this.prisma.employee.update({ where: { id }, data, include: { department: true } });
    }

    remove(id: string) {
        return this.prisma.employee.delete({ where: { id } });
    }
}
