import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private svc: TicketsService) {}

  @Post('purchase')
  async purchase(@Body() body: { email: string; qty?: number }) {
    return this.svc.purchase(body.email, body.qty ?? 1);
  }

  @Get(':id')
  async ticket(@Param('id') id: string) {
    // demo: return minimal
    return { id };
  }
}
