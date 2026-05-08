import { Module } from '@nestjs/common';
import { AdminExtrasController } from './admin-extras.controller';
import { AdminExtrasService } from './admin-extras.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminExtrasController],
    providers: [AdminExtrasService],
})
export class AdminExtrasModule { }
