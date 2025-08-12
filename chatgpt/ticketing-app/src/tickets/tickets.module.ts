import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Order, User])],
  providers: [TicketsService],
  controllers: [TicketsController]
})
export class TicketsModule {}
