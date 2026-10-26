import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SlotsModule } from './slots/slots.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, SlotsModule, BookingsModule],
})
export class AppModule {}
