import { Module } from '@nestjs/common';
import { ProcurementRequestsController } from './procurement-requests.controller';
import { ProcurementRequestsService } from './procurement-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProcurementRequestsController],
    providers: [ProcurementRequestsService],
})
export class ProcurementRequestsModule { }
