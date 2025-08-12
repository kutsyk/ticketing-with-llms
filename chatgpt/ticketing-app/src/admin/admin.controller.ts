import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private svc: AdminService) {}

  @Get('users') async users(){ return this.svc.users.find(); }
  @Get('tickets') async tickets(){ return this.svc.tickets.find(); }
  @Get('orders') async orders(){ return this.svc.orders.find(); }
  @Get('scans') async scans(){ return this.svc.scans.find({ relations: ['ticket'] }); }
}
