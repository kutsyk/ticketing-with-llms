import { Body, Controller, Post } from '@nestjs/common';
import { ScanService } from './scan.service';

@Controller('scan')
export class ScanController {
  constructor(private svc: ScanService) {}

  @Post()
  async scan(@Body() body: { qr_token: string }) {
    return this.svc.scan(body.qr_token);
  }
}
