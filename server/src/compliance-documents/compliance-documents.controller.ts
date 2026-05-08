import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ComplianceDocumentsService } from './compliance-documents.service';

@Controller()
export class ComplianceDocumentsController {
    constructor(private readonly svc: ComplianceDocumentsService) { }

    @Get('compliance-documents')
    getAll(@Query('level') level?: string) { return this.svc.findAll(level); }

    @Get('compliance-documents/:id')
    getOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post('compliance-documents')
    create(@Body() body: any) { return this.svc.create(body); }

    @Put('compliance-documents/:id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete('compliance-documents/:id')
    remove(@Param('id') id: string) { return this.svc.remove(id); }
}
