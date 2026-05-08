import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveTypesService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    }

    findOne(id: string) {
        return this.prisma.leaveType.findUniqueOrThrow({ where: { id } });
    }

    create(data: any) {
        return this.prisma.leaveType.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.leaveType.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.leaveType.delete({ where: { id } });
    }
}
