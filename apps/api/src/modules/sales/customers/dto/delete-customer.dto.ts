import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteCustomerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
