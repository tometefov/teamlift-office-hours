import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import type { Booking, Slot } from "../lib/types";
import { fmtDay, fmtRange, groupByDay, todayLocal } from "../lib/format";

export function CoachView() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api.listSlots(), api.listBookings()]);
      setSlots(s);
      setBookings(b);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = slots.filter((s) => s.status === "AVAILABLE").length;

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat"><strong>{slots.length}</strong><span>upcoming slots</span></div>
        <div className="stat"><strong>{open}</strong><span>still open</span></div>
        <div className="stat"><strong>{bookings.length}</strong><span>booked sessions</span></div>
      </div>

      <NewSlotForm onCreated={load} />
      {error && <p className="alert" role="alert">{error}</p>}

      <section>
        <h2>Booked sessions</h2>
        {!loading && bookings.length === 0 && (
          <p className="empty">No bookings yet. Once a champion books, you'll see their question and an AI prep note here.</p>
        )}
        <div className="cards">
          {bookings.map((b) => (
            <article key={b.id} className="card">
              <p className="card-when">{fmtDay(b.slot.startsAt)} · {fmtRange(b.slot.startsAt, b.slot.durationMinutes)}</p>
              <p className="card-who"><strong>{b.name}</strong> <span className="muted">· {b.email}</span></p>
              <blockquote>{b.note}</blockquote>
              {b.aiCoachSummary && (
                <div className="ai-box">
                  <span className="ai-label">✦ AI prep note</span>
                  <p>{b.aiCoachSummary}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Your schedule</h2>
        {!loading && slots.length === 0 && <p className="empty">No upcoming slots. Publish one above.</p>}
        {groupByDay(slots).map(([day, items]) => (
          <div key={day} className="day">
            <h3>{day}</h3>
            <div className="chips">
              {items.map((s) => (
                <span key={s.id} className={`chip static${s.status === "BOOKED" ? " booked" : ""}`}>
                  {fmtRange(s.startsAt, s.durationMinutes)}
                  <span className="chip-tag">{s.status === "BOOKED" ? "Booked" : "Open"}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function NewSlotForm({ onCreated }: { onCreated: () => void }) {
  const [date, setDate] = useState(todayLocal());
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return setError("Please choose a valid date and time.");
    if (start.getTime() < Date.now()) return setError("That time has already passed.");
    setSaving(true);
    try {
      const slot = await api.createSlot(start.toISOString(), duration);
      setSuccess(`Published ${fmtDay(slot.startsAt)}, ${fmtRange(slot.startsAt, slot.durationMinutes)}.`);
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Publish a slot</h2>
      <p className="muted">Champions will see it right away in their schedule.</p>
      <div className="slot-form">
        <label>Date<input type="date" min={todayLocal()} value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label>Start time<input type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} required /></label>
        <label>
          Duration
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
        <button className="btn primary" disabled={saving}>{saving ? "Publishing…" : "Publish"}</button>
      </div>
      {error && <p className="alert" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}
    </form>
  );
}
