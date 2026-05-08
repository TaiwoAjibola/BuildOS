import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
    constructor(private readonly svc: ReportsService) { }

    @Get('reports')
    getAll(@Query('module') module?: string) { return this.svc.findAll(module); }

    @Get('reports/:id')
    getOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post('reports')
    create(@Body() body: any) { return this.svc.create(body); }

    @Put('reports/:id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete('reports/:id')
    remove(@Param('id') id: string) { return this.svc.remove(id); }

    @Post('reports/:id/run')
    run(@Param('id') id: string) { return this.svc.runReport(id); }

    @Get('reports/:id/runs')
    getRuns(@Param('id') id: string) { return this.svc.getRunsForReport(id); }
}
