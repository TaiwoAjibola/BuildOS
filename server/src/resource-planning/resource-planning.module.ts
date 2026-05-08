import { Module } from '@nestjs/common';
import { ResourcePlanningController } from './resource-planning.controller';
import { ResourcePlanningService } from './resource-planning.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ResourcePlanningController],
    providers: [ResourcePlanningService],
})
export class ResourcePlanningModule { }
