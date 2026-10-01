import { IsIn, IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateBackupScheduleDto {
  @IsIn(['daily', 'weekly'])
  frequency!: 'daily' | 'weekly';

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'Backup time must use HH:MM',
  })
  backupTime!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  backupDay!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  retentionMaxFiles!: number;

  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays!: number;
}
