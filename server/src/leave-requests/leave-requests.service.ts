import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveRequestsService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, employeeId?: string) {
        return this.prisma.leaveRequest.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(employeeId ? { employeeId } : {}),
            },
            include: { employee: true, leaveType: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.leaveRequest.findUniqueOrThrow({
            where: { id },
            include: { employee: true, leaveType: true },
        });
    }

    create(data: any) {
        return this.prisma.leaveRequest.create({
            data,
            include: { employee: true, leaveType: true },
        });
    }

    update(id: string, data: any) {
        return this.prisma.leaveRequest.update({
            where: { id },
            data,
            include: { employee: true, leaveType: true },
        });
    }

    remove(id: string) {
        return this.prisma.leaveRequest.delete({ where: { id } });
    }
}
