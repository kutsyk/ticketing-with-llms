import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Ticket } from '../entities/ticket.entity';
import { Order } from '../entities/order.entity';
import { Scan } from '../entities/scan.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) public users: Repository<User>,
    @InjectRepository(Ticket) public tickets: Repository<Ticket>,
    @InjectRepository(Order) public orders: Repository<Order>,
    @InjectRepository(Scan) public scans: Repository<Scan>,
  ) {}
}
