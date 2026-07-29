import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  getStatus(): { status: string } {
    return this.authService.getStatus();
  }
}
