import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import { UsersService } from './users.service';

@Injectable()
export class OwnerVerificationService {
  constructor(private readonly usersService: UsersService) {}

  async assertPassword(
    organizationId: string,
    actorUserId: string,
    ownerPassword: string,
  ): Promise<void> {
    const owner = await this.usersService.findByIdAndOrganization(
      actorUserId,
      organizationId,
    );

    if (!owner || owner.role !== 'OWNER' || !owner.isActive) {
      throw new ForbiddenException(
        'Only the active company owner can reset company data',
      );
    }

    if (!(await compare(ownerPassword, owner.passwordHash))) {
      throw new UnauthorizedException('Owner password is incorrect');
    }
  }
}
