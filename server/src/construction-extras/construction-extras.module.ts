import { Module } from '@nestjs/common';
import { ConstructionExtrasController } from './construction-extras.controller';
import { ConstructionExtrasService } from './construction-extras.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ConstructionExtrasController],
    providers: [ConstructionExtrasService],
})
export class ConstructionExtrasModule { }
