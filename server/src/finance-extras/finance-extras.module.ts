import { Module } from '@nestjs/common';
import { FinanceExtrasController } from './finance-extras.controller';
import { FinanceExtrasService } from './finance-extras.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FinanceExtrasController],
    providers: [FinanceExtrasService],
})
export class FinanceExtrasModule { }
