import { IsInt, IsISO8601, Max, Min } from 'class-validator';

export class CreateSlotDto {
  /** Start of the slot as an ISO 8601 string, e.g. "2026-11-05T14:00:00.000Z". */
  @IsISO8601()
  startsAt: string;

  @IsInt()
  @Min(10)
  @Max(180)
  durationMinutes: number;
}
