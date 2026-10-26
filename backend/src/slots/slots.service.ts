import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';

const MINUTE = 60_000;

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSlotDto) {
    const start = new Date(dto.startsAt);
    const end = new Date(start.getTime() + dto.durationMinutes * MINUTE);

    if (start.getTime() < Date.now()) {
      throw new BadRequestException('A slot cannot start in the past.');
    }

    // The coach can't be in two sessions at once: reject overlapping slots.
    // Only slots starting within the last 3 hours can overlap (max duration is 180 min).
    const nearby = await this.prisma.slot.findMany({
      where: { startsAt: { gte: new Date(start.getTime() - 180 * MINUTE), lt: end } },
    });
    const clash = nearby.find((s) => {
      const sEnd = s.startsAt.getTime() + s.durationMinutes * MINUTE;
      return s.startsAt.getTime() < end.getTime() && sEnd > start.getTime();
    });
    if (clash) {
      throw new ConflictException('This overlaps with a slot you already published.');
    }

    return this.prisma.slot.create({
      data: { startsAt: start, durationMinutes: dto.durationMinutes },
    });
  }

  /** Upcoming slots, soonest first. Booker details stay private. */
  findUpcoming() {
    return this.prisma.slot.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      select: { id: true, startsAt: true, durationMinutes: true, status: true },
    });
  }
}
