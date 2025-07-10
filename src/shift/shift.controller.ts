// src/shift/shift.controller.ts
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { ShiftService } from './shift.service';
  import { JwtAuthGuard } from '../auth/jwt.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../auth/roles.decorator';
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Controller('shifts')
  export class ShiftController {
    constructor(private readonly shiftService: ShiftService) {}
  
    @Roles('company')
    @Post()
    create(@Body() body: any, @Req() req: any) {
      return this.shiftService.createShift(body, req.user.userId);
    }
  
    @Get()
    getAll() {
      return this.shiftService.getAllShifts();
    }
  
    @Roles('user')
    @Post(':id/apply')
    apply(@Param('id') id: string, @Body() body: any, @Req() req: any) {
      return this.shiftService.applyToShift(id, req.user.userId, body.note);
    }
  
    @Roles('company')
    @Get('company/my')
    getCompanyShifts(@Req() req: any) {
      return this.shiftService.getCompanyShifts(req.user.userId);
    }
  }
  