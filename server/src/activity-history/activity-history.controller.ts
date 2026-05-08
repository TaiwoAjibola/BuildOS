import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ActivityHistoryService } from './activity-history.service';

@Controller()
export class ActivityHistoryController {
    constructor(private readonly svc: ActivityHistoryService) { }

    @Get('activity-history')
    getAll(
        @Query('module') module?: string,
        @Query('userId') userId?: string,
    ) { return this.svc.findAll(module, userId); }

    @Get('activity-history/:id')
    getOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post('activity-history')
    create(@Body() body: any) { return this.svc.create(body); }

    @Delete('activity-history/:id')
    remove(@Param('id') id: string) { return this.svc.remove(id); }
}
