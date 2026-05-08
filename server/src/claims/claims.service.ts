import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClaimsService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, employeeId?: string) {
        return this.prisma.claim.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(employeeId ? { employeeId } : {}),
            },
            include: { employee: { include: { department: true } }, claimType: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.claim.findUniqueOrThrow({
            where: { id },
            include: { employee: { include: { department: true } }, claimType: true },
        });
    }

    create(data: any) {
        return this.prisma.claim.create({
            data,
            include: { employee: { include: { department: true } }, claimType: true },
        });
    }

    update(id: string, data: any) {
        return this.prisma.claim.update({
            where: { id },
            data,
            include: { employee: { include: { department: true } }, claimType: true },
        });
    }

    remove(id: string) {
        return this.prisma.claim.delete({ where: { id } });
    }
}
