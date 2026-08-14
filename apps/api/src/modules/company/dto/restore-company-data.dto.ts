import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RestoreCompanyDataDto {
  @ApiProperty({ example: 'RESTORE MYCOMPANY' })
  @IsString()
  @MaxLength(120)
  confirmation!: string;
}
