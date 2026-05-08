import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
    constructor(private readonly svc: TasksService) { }

    @Get('tasks')
    getAll(
        @Query('status') status?: string,
        @Query('projectId') projectId?: string,
        @Query('assignedTo') assignedTo?: string,
    ) { return this.svc.findAll(status, projectId, assignedTo); }

    @Get('tasks/:id')
    getOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post('tasks')
    create(@Body() body: any) { return this.svc.create(body); }

    @Put('tasks/:id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete('tasks/:id')
    remove(@Param('id') id: string) { return this.svc.remove(id); }
}
