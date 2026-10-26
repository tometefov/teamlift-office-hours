import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** A champion books a slot. Returns 409 if it was already taken. */
  @Post('slots/:id/book')
  book(@Param('id') slotId: string, @Body() dto: CreateBookingDto) {
    return this.bookings.book(slotId, dto);
  }

  /** Coach sees upcoming bookings and AI prep notes. */
  @Get('bookings')
  findUpcoming() {
    return this.bookings.findUpcoming();
  }
}
