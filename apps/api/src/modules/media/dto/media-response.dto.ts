import { ApiProperty } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  size!: number;
}
