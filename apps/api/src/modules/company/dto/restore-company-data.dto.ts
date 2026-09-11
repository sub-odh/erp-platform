import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RestoreCompanyDataDto {
  @ApiProperty({ example: 'RESTORE MYCOMPANY' })
  @IsString()
  @MaxLength(120)
  confirmation!: string;

  @ApiProperty({
    description: 'Current password of the signed-in company owner',
    format: 'password',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  ownerPassword!: string;
}
