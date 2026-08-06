import { ApiProperty } from '@nestjs/swagger';

export class ResetUserPasswordResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    description:
      'Temporary password returned once. It is not stored in plain text.',
    example: 'A7!kP9#mQ2@xR4$z',
  })
  temporaryPassword!: string;

  @ApiProperty({
    example: true,
  })
  mustChangePassword!: boolean;
}
