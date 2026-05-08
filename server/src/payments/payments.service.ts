import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, type?: string) {
        return this.prisma.payment.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(type ? { type: type as any } : {}),
            },
            orderBy: { date: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.payment.findUniqueOrThrow({ where: { id } });
    }

    create(data: any) {
        return this.prisma.payment.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.payment.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.payment.delete({ where: { id } });
    }
}
