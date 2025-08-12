// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) email!: string;
  @Column({ nullable: true }) password_hash?: string; // null if Google only
  @Column({ default: 'USER' }) role!: 'USER'|'CHECKER'|'SELLER'|'ADMIN';
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

// order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => User, { nullable: true }) user?: User;
  @Column() amount_cents!: number;
  @Column({ default: 'PAID' }) status!: 'PENDING'|'PAID'|'CANCELED'|'REFUNDED';
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

// ticket.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Order, { nullable: true }) order?: Order;
  @ManyToOne(() => User, { nullable: true }) owner?: User;
  @Column({ unique: true }) serial!: string;
  @Column({ unique: true }) qr_token!: string; // uuid string
  @Column({ default: 'NEW' }) status!: 'NEW'|'SENT'|'USED'|'VOID';
  @Column({ type: 'timestamptz', nullable: true }) used_at?: Date;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

// scan.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from './user.entity';

@Entity('ticket_scans')
export class Scan {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Ticket, { nullable: false }) ticket!: Ticket;
  @ManyToOne(() => User, { nullable: true }) scanned_by?: User;
  @Column() result!: 'OK'|'ALREADY_USED'|'VOID'|'NOT_FOUND';
  @CreateDateColumn() created_at!: Date;
}
