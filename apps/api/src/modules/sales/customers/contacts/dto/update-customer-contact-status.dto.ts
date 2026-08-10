import { IsBoolean } from 'class-validator';

export class UpdateCustomerContactStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
