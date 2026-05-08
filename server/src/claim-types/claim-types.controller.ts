import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ClaimTypesService } from './claim-types.service';

@Controller('claim-types')
export class ClaimTypesController {
    constructor(private readonly claimTypesService: ClaimTypesService) { }

    @Get()
    findAll() {
        return this.claimTypesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.claimTypesService.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.claimTypesService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.claimTypesService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.claimTypesService.remove(id);
    }
}
