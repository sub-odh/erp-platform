import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class LogoutAllDto {
  @ApiProperty()
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
