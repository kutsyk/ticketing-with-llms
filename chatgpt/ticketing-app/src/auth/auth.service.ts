import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}
  async register(email: string, password: string) {
    const password_hash = crypto.createHash('sha256').update(password).digest('hex'); // demo only
    const user = this.users.create({ email, password_hash, role: 'USER' });
    return this.users.save(user);
  }
  async login(email: string, password: string) {
    const u = await this.users.findOne({ where: { email } });
    if (!u) return null;
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return u.password_hash === hash ? u : null;
  }
}
