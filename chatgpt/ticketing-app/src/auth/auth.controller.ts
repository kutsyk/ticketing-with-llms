import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    const u = await this.auth.register(body.email, body.password);
    return { id: u.id, email: u.email, role: u.role };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const u = await this.auth.login(body.email, body.password);
    if (!u) return { error: 'INVALID_CREDENTIALS' };
    // For demo: return user; in production issue JWT
    return { id: u.id, email: u.email, role: u.role };
  }
}
