import { Module } from '@nestjs/common';
import { ActivityHistoryController } from './activity-history.controller';
import { ActivityHistoryService } from './activity-history.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ActivityHistoryController],
    providers: [ActivityHistoryService],
})
export class ActivityHistoryModule { }
