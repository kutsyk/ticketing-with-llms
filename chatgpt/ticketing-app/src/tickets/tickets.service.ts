import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

@Injectable()
export class TicketsService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mailhog',
    port: Number(process.env.SMTP_PORT || 1025),
  });
  constructor(
    @InjectRepository(Ticket) private tickets: Repository<Ticket>,
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async purchase(email: string, qty = 1) {
    let user = await this.users.findOne({ where: { email } });
    if (!user) user = await this.users.save(this.users.create({ email, role: 'USER' }));

    const order = await this.orders.save(this.orders.create({ user, amount_cents: 1000, status: 'PAID' }));
    const created: Ticket[] = [];

    for (let i = 0; i < qty; i++) {
      const serial = Math.random().toString(36).slice(2, 10).toUpperCase();
      const ticket = this.tickets.create({
        order,
        owner: user,
        serial,
        qr_token: randomUUID(),
        status: 'NEW'
      });
      const saved = await this.tickets.save(ticket);
      await this.emailTicket(user.email, saved);
      created.push(saved);
    }

    return { order_id: order.id, tickets: created.map(t => ({ id: t.id, serial: t.serial })) };
  }

  async emailTicket(email: string, ticket: Ticket) {
    const dataUrl = await QRCode.toDataURL(ticket.qr_token, { errorCorrectionLevel: 'M' });
    const base64 = dataUrl.split(',')[1];
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@example.local',
      to: email,
      subject: `Your Ticket ${ticket.serial}`,
      html: `<p>Show this QR at entry.</p><p>Serial: <b>${ticket.serial}</b></p><img src="cid:qr"/>`,
      attachments: [{ filename: `ticket-${ticket.serial}.png`, content: Buffer.from(base64, 'base64'), cid: 'qr' }]
    });
    ticket.status = 'SENT';
    await this.tickets.save(ticket);
  }
}
