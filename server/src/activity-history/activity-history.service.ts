import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityHistoryService {
    constructor(private prisma: PrismaService) { }

    findAll(module?: string, userId?: string) {
        return this.prisma.activityRecord.findMany({
            where: {
                ...(module ? { module } : {}),
                ...(userId ? { userId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id: string) { return this.prisma.activityRecord.findUnique({ where: { id } }); }
    create(data: any) { return this.prisma.activityRecord.create({ data }); }
    remove(id: string) { return this.prisma.activityRecord.delete({ where: { id } }); }
}
