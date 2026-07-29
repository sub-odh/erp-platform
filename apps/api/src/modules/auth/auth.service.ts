import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getStatus(): { status: string } {
    return {
      status: 'Authentication module is ready',
    };
  }
}
