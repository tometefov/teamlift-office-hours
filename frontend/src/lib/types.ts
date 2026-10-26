export type SlotStatus = "AVAILABLE" | "BOOKED";

export interface Slot {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: SlotStatus;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  note: string;
  aiConfirmation: string | null;
  aiCoachSummary: string | null;
  createdAt: string;
  slot: Slot;
}
