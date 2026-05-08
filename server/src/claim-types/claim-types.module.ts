import { Module } from '@nestjs/common';
import { ClaimTypesController } from './claim-types.controller';
import { ClaimTypesService } from './claim-types.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ClaimTypesController],
    providers: [ClaimTypesService],
})
export class ClaimTypesModule { }
