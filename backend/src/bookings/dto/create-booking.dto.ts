import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsEmail()
  email: string;

  /** What the champion is stuck on. Used to generate the coach's prep note. */
  @IsString()
  @MinLength(5)
  @MaxLength(600)
  note: string;
}
