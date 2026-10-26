import type { Booking, Slot } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Error carrying the HTTP status, so the UI can react to 409 Conflict. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new ApiError(msg ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const api = {
  listSlots: () => request<Slot[]>("/slots"),
  createSlot: (startsAt: string, durationMinutes: number) =>
    request<Slot>("/slots", { method: "POST", body: JSON.stringify({ startsAt, durationMinutes }) }),
  book: (slotId: string, data: { name: string; email: string; note: string }) =>
    request<Booking>(`/slots/${slotId}/book`, { method: "POST", body: JSON.stringify(data) }),
  listBookings: () => request<Booking[]>("/bookings"),
};
