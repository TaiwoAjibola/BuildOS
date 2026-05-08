import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceDocumentsService {
    constructor(private prisma: PrismaService) { }

    findAll(level?: string) {
        return this.prisma.complianceDocumentType.findMany({
            where: level ? { level } : {},
            orderBy: { name: 'asc' },
        });
    }
    findOne(id: string) { return this.prisma.complianceDocumentType.findUnique({ where: { id } }); }
    create(data: any) { return this.prisma.complianceDocumentType.create({ data }); }
    update(id: string, data: any) { return this.prisma.complianceDocumentType.update({ where: { id }, data }); }
    remove(id: string) { return this.prisma.complianceDocumentType.delete({ where: { id } }); }
}
