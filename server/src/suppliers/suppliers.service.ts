import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.supplier.findMany({
            include: { materials: true },
            orderBy: { name: 'asc' },
        });
    }

    findOne(id: string) {
        return this.prisma.supplier.findUniqueOrThrow({
            where: { id },
            include: { materials: true },
        });
    }

    create(data: any) {
        return this.prisma.supplier.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.supplier.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.supplier.delete({ where: { id } });
    }
}
