import { ApiProperty } from '@nestjs/swagger';

import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_POLICY_MESSAGE,
} from '../../../common/security/password-policy';

export class ChangePasswordDto {
  /*
   * Do not apply the new password policy to
   * currentPassword.
   *
   * Existing users may still have passwords
   * created under an older policy and must be
   * able to authenticate before replacing them.
   */
  @ApiProperty({
    description: 'Current account password',
    minLength: 1,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword!: string;

  @ApiProperty({
    description: 'New account password',
    example: 'Erp@2026',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_POLICY_MESSAGE,
  })
  newPassword!: string;
}
