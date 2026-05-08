import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClaimTypesService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.claimType.findMany({ orderBy: { name: 'asc' } });
    }

    findOne(id: string) {
        return this.prisma.claimType.findUniqueOrThrow({ where: { id } });
    }

    create(data: any) {
        return this.prisma.claimType.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.claimType.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.claimType.delete({ where: { id } });
    }
}
