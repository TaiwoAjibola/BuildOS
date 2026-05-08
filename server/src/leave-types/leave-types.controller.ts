import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';

@Controller('leave-types')
export class LeaveTypesController {
    constructor(private readonly leaveTypesService: LeaveTypesService) { }

    @Get()
    findAll() {
        return this.leaveTypesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leaveTypesService.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.leaveTypesService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.leaveTypesService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.leaveTypesService.remove(id);
    }
}
