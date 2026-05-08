import { Module } from '@nestjs/common';
import { ComplianceDocumentsController } from './compliance-documents.controller';
import { ComplianceDocumentsService } from './compliance-documents.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ComplianceDocumentsController],
    providers: [ComplianceDocumentsService],
})
export class ComplianceDocumentsModule { }
