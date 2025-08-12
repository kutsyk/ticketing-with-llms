import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Scan } from '../entities/scan.entity';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Scan])],
  providers: [ScanService],
  controllers: [ScanController]
})
export class ScanModule {}
