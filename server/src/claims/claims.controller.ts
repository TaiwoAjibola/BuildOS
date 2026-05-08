import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Controller('claims')
export class ClaimsController {
    constructor(private readonly claimsService: ClaimsService) { }

    @Get()
    findAll(@Query('status') status?: string, @Query('employeeId') employeeId?: string) {
        return this.claimsService.findAll(status, employeeId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.claimsService.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.claimsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.claimsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.claimsService.remove(id);
    }
}
