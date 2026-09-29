import { IsString, MinLength } from 'class-validator';

export class SecureDeleteInventoryDto {
  @IsString()
  @MinLength(1)
  password!: string;
}
