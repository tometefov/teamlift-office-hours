import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const TAKEN = 'Sorry, someone just booked this slot. Please pick another one.';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /**
   * Books a slot. Double booking is blocked in two layers:
   * 1. An atomic conditional update: "set BOOKED where id = X AND status = AVAILABLE".
   *    If two requests race, only one of them updates a row; the other gets count = 0.
   * 2. Booking.slotId is UNIQUE, so the database rejects a second booking regardless.
   * The AI call runs after the transaction, so a slow AI never blocks or breaks a booking.
   */
  async book(slotId: string, dto: CreateBookingDto) {
    let booking;
    try {
      booking = await this.prisma.$transaction(async (tx) => {
        const slot = await tx.slot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundException('Slot not found.');
        if (slot.startsAt.getTime() < Date.now()) {
          throw new ConflictException('This slot has already started.');
        }

        const claimed = await tx.slot.updateMany({
          where: { id: slotId, status: 'AVAILABLE' },
          data: { status: 'BOOKED' },
        });
        if (claimed.count === 0) throw new ConflictException(TAKEN);

        return tx.booking.create({
          data: { slotId, name: dto.name, email: dto.email, note: dto.note },
          include: { slot: true },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(TAKEN);
      }
      throw e;
    }

    const texts = await this.ai.generate({
      name: booking.name,
      note: booking.note,
      startsAt: booking.slot.startsAt,
      durationMinutes: booking.slot.durationMinutes,
    });

    return this.prisma.booking.update({
      where: { id: booking.id },
      data: { aiConfirmation: texts.confirmation, aiCoachSummary: texts.coachSummary },
      include: { slot: true },
    });
  }

  /** Coach dashboard: upcoming bookings with AI prep notes. */
  findUpcoming() {
    return this.prisma.booking.findMany({
      where: { slot: { startsAt: { gte: new Date() } } },
      orderBy: { slot: { startsAt: 'asc' } },
      include: { slot: true },
    });
  }
}
