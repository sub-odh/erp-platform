import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: false,
    description: 'Whether the user account is active',
  })
  @IsBoolean()
  isActive!: boolean;
}
