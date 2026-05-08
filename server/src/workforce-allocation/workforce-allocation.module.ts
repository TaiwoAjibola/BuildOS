import { Module } from '@nestjs/common';
import { WorkforceAllocationController } from './workforce-allocation.controller';
import { WorkforceAllocationService } from './workforce-allocation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WorkforceAllocationController],
    providers: [WorkforceAllocationService],
})
export class WorkforceAllocationModule { }
