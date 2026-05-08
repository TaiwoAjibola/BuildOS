import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConstructionExtrasService {
    constructor(private prisma: PrismaService) { }

    // ── Project Documents ──
    findAllDocs(projectId?: string) {
        return this.prisma.projectDocument.findMany({
            where: projectId ? { projectId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    findDoc(id: string) {
        return this.prisma.projectDocument.findUniqueOrThrow({ where: { id } });
    }
    createDoc(data: any) {
        return this.prisma.projectDocument.create({ data });
    }
    updateDoc(id: string, data: any) {
        return this.prisma.projectDocument.update({ where: { id }, data });
    }
    deleteDoc(id: string) {
        return this.prisma.projectDocument.delete({ where: { id } });
    }

    // ── Construction Approvals ──
    findAllApprovals(status?: string, projectId?: string) {
        return this.prisma.constructionApproval.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(projectId ? { projectId } : {}),
            },
            orderBy: { requestDate: 'desc' },
        });
    }
    findApproval(id: string) {
        return this.prisma.constructionApproval.findUniqueOrThrow({ where: { id } });
    }
    createApproval(data: any) {
        return this.prisma.constructionApproval.create({ data });
    }
    updateApproval(id: string, data: any) {
        return this.prisma.constructionApproval.update({ where: { id }, data });
    }
    deleteApproval(id: string) {
        return this.prisma.constructionApproval.delete({ where: { id } });
    }

    // ── Timelines ──
    findAllTimelines(projectId?: string) {
        return this.prisma.timeline.findMany({
            where: projectId ? { projectId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    findTimeline(id: string) {
        return this.prisma.timeline.findUniqueOrThrow({ where: { id } });
    }
    createTimeline(data: any) {
        return this.prisma.timeline.create({ data });
    }
    updateTimeline(id: string, data: any) {
        return this.prisma.timeline.update({ where: { id }, data });
    }
    deleteTimeline(id: string) {
        return this.prisma.timeline.delete({ where: { id } });
    }
}
