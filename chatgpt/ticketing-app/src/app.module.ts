import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Ticket } from './entities/ticket.entity';
import { Order } from './entities/order.entity';
import { Scan } from './entities/scan.entity';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { ScanModule } from './scan/scan.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Ticket, Order, Scan],
      synchronize: true, // dev-only
    }),
    AuthModule,
    TicketsModule,
    ScanModule,
    AdminModule,
  ],
})
export class AppModule {}
