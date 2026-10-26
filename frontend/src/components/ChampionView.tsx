import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import type { Booking, Slot } from "../lib/types";
import { fmtDay, fmtRange, groupByDay } from "../lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChampionView() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSlots(await api.listSlots());
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

  if (booked) {
    return (
      <section className="panel confirm" role="status">
        <div className="check" aria-hidden>✓</div>
        <h2>You're booked, {booked.name.split(" ")[0]}!</h2>
        <p className="muted">
          {fmtDay(booked.slot.startsAt)} · {fmtRange(booked.slot.startsAt, booked.slot.durationMinutes)}
        </p>
        {booked.aiConfirmation && (
          <div className="ai-box">
            <span className="ai-label">✦ From your coach's assistant</span>
            <p>{booked.aiConfirmation}</p>
          </div>
        )}
        <button className="btn primary" onClick={() => setBooked(null)}>Back to schedule</button>
      </section>
    );
  }

  const open = slots.filter((s) => s.status === "AVAILABLE");
  const days = groupByDay(slots);

  return (
    <div className="split">
      <section>
        <h2>Pick a time</h2>
        <p className="muted">{loading ? "Loading…" : `${open.length} open slot${open.length === 1 ? "" : "s"} with your coach`}</p>
        {error && <p className="alert" role="alert">{error}</p>}
        {notice && <p className="alert" role="alert">{notice}</p>}
        {!loading && !error && slots.length === 0 && (
          <p className="empty">No office hours published yet. Check back soon.</p>
        )}
        {days.map(([day, items]) => (
          <div key={day} className="day">
            <h3>{day}</h3>
            <div className="chips">
              {items.map((s) => {
                const isBooked = s.status === "BOOKED";
                return (
                  <button
                    key={s.id}
                    className={`chip${selected?.id === s.id ? " active" : ""}`}
                    disabled={isBooked}
                    aria-pressed={selected?.id === s.id}
                    onClick={() => {
                      setSelected(s);
                      setNotice(null);
                    }}
                  >
                    {fmtRange(s.startsAt, s.durationMinutes)}
                    {isBooked && <span className="chip-tag">Booked</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <aside>
        {selected ? (
          <BookingForm
            key={selected.id}
            slot={selected}
            onCancel={() => setSelected(null)}
            onBooked={(b) => {
              setBooked(b);
              setSelected(null);
              load();
            }}
            onTaken={(msg) => {
              setNotice(msg);
              setSelected(null);
              load();
            }}
          />
        ) : (
          <div className="panel placeholder">
            <p className="muted">Select a time to book a 1:1 with your coach.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

interface FormProps {
  slot: Slot;
  onCancel: () => void;
  onBooked: (b: Booking) => void;
  onTaken: (message: string) => void;
}

function BookingForm({ slot, onCancel, onBooked, onTaken }: FormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: name.trim().length < 2 ? "Please enter your name." : null,
    email: !EMAIL_RE.test(email.trim()) ? "Please enter a valid email." : null,
    note: note.trim().length < 5 ? "A sentence or two helps your coach prepare." : null,
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (errors.name || errors.email || errors.note) return;
    setSubmitting(true);
    setError(null);
    try {
      onBooked(await api.book(slot.id, { name: name.trim(), email: email.trim(), note: note.trim() }));
    } catch (e) {
      // 409 = someone else got this slot first: refresh the list and explain.
      if (e instanceof ApiError && e.status === 409) {
        onTaken(e.message);
        return;
      }
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <div>
        <h2>Book this slot</h2>
        <p className="muted">{fmtDay(slot.startsAt)} · {fmtRange(slot.startsAt, slot.durationMinutes)}</p>
      </div>
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={touched && !!errors.name} autoComplete="name" />
        {touched && errors.name && <span className="field-error">{errors.name}</span>}
      </label>
      <label>
        Work email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && !!errors.email} autoComplete="email" />
        {touched && errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      <label>
        What are you stuck on?
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={touched && !!errors.note}
          placeholder="e.g. My team wants to use AI to summarize client calls, but I'm not sure how to write a prompt that keeps the important details."
        />
        {touched && errors.note && <span className="field-error">{errors.note}</span>}
      </label>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? "Booking & preparing your coach…" : "Confirm booking"}
        </button>
      </div>
    </form>
  );
}
