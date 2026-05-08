import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';

@Controller('leave-requests')
export class LeaveRequestsController {
    constructor(private readonly leaveRequestsService: LeaveRequestsService) { }

    @Get()
    findAll(@Query('status') status?: string, @Query('employeeId') employeeId?: string) {
        return this.leaveRequestsService.findAll(status, employeeId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leaveRequestsService.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.leaveRequestsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.leaveRequestsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.leaveRequestsService.remove(id);
    }
}
