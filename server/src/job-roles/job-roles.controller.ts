import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { JobRolesService } from './job-roles.service';

@Controller()
export class JobRolesController {
    constructor(private readonly svc: JobRolesService) { }

    @Get('job-roles')
    getAll(@Query('department') department?: string) { return this.svc.findAll(department); }

    @Get('job-roles/:id')
    getOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post('job-roles')
    create(@Body() body: any) { return this.svc.create(body); }

    @Put('job-roles/:id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete('job-roles/:id')
    remove(@Param('id') id: string) { return this.svc.remove(id); }
}
