import { Body, Controller, Get, Post } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slots: SlotsService) {}

  /** Coach publishes a new slot. */
  @Post()
  create(@Body() dto: CreateSlotDto) {
    return this.slots.create(dto);
  }

  /** List upcoming slots with their status. */
  @Get()
  findUpcoming() {
    return this.slots.findUpcoming();
  }
}
