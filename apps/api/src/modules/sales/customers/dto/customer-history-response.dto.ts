import type { CustomerResponseDto } from './customer-response.dto';

export class CustomerHistoryOrderDto {
  id!: string;
  deliveryNumber!: string;
  deliveryDate!: string;
  totalAmount!: string;
  balanceDue!: string;
  status!: string;
  invoiceId!: string | null;
  invoiceNumber!: string | null;
}

export class CustomerHistoryResponseDto {
  customer!: CustomerResponseDto;
  orders!: CustomerHistoryOrderDto[];
  totalOrders!: number;
  totalDue!: string;
}
