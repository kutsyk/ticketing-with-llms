import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Scan } from '../entities/scan.entity';

@Injectable()
export class ScanService {
  constructor(
    @InjectRepository(Ticket) private tickets: Repository<Ticket>,
    @InjectRepository(Scan) private scans: Repository<Scan>,
  ) {}

  async scan(qr_token: string) {
    const t = await this.tickets.findOne({ where: { qr_token: qr_token } });
    if (!t) return { result: 'NOT_FOUND' as const };
    if (t.status === 'VOID') return { result: 'VOID' as const };
    if (t.status === 'USED') return { result: 'ALREADY_USED' as const, used_at: t.used_at };

    t.status = 'USED';
    t.used_at = new Date();
    await this.tickets.save(t);
    await this.scans.save(this.scans.create({ ticket: t, result: 'OK' }));
    return { result: 'OK' as const, ticket_id: t.id, used_at: t.used_at };
  }
}
