import { IsIn } from 'class-validator';

import {
  ASSIGNABLE_LEAD_STATUSES,
  type AssignableLeadStatus,
} from './create-lead.dto';

export class UpdateLeadStatusDto {
  @IsIn(ASSIGNABLE_LEAD_STATUSES)
  status!: AssignableLeadStatus;
}
