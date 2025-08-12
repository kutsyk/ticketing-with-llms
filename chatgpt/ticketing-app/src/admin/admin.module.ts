import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';
import { Ticket } from '../entities/ticket.entity';
import { Scan } from '../entities/scan.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Ticket, Scan])],
  providers: [AdminService],
  controllers: [AdminController]
})
export class AdminModule {}
