# Office Hours for AI Champions

My submission for the TeamLift Product Engineer challenge.

A coach publishes 1:1 office-hour slots. An AI champion picks one, books it with his name and email, and writes why he needs that consultation block, practically few lines about what they're stuck on. Once a slot is booked nobody else can take it. Gemini then writes a short confirmation for the champion in relation to the written line and a prep note for the coach.

## Why office hours

From what I read about TeamLift, coaches work with AI champions inside client teams. If one coach supports a lot of champions, two things get annoying: finding a time, and starting a session without knowing what the person needs. So I kept the scheduling part from the brief and used the AI piece for the second problem.

## What it does

Champion side:
- see the upcoming slots grouped by day. These are only the times the coach has published, so every slot shown already works for the coach (booked ones are greyed out)
- book with name, email and a short note
- get an AI-written confirmation
- if someone books the same slot a second earlier, you get a clear message and the list refreshes 

Coach side:
- publish a slot (date, start time, duration), as I said that only works for the coach
- slots in the past or overlapping an existing slot are rejected by the API
- see booked sessions with the champion's note and the AI prep note

## Stack

- Frontend: React 18 + TypeScript, Vite, plain CSS
- Backend: NestJS 10, class-validator
- Database: PostgreSQL on Neon, through Prisma
- AI: Gemini API (free tier)

## Double booking

The UI only showing free slots isn't enough, since two people can click at the same time. The check happens in `backend/src/bookings/bookings.service.ts`:

1. Inside a transaction the slot is claimed with an update that only matches if it's still free (`WHERE id = ? AND status = 'AVAILABLE'`). If two requests race, only one updates the row. The other gets 0 rows back and the API returns 409.
2. `Booking.slotId` is unique in the Prisma schema, so Postgres itself refuses a second booking for the same slot.

The Gemini call happens after the transaction. If Gemini is slow or down, the booking is still saved and a simple template message is used instead.

## API

```
GET  /slots            upcoming slots with status
POST /slots            { startsAt, durationMinutes }
POST /slots/:id/book   { name, email, note }   -> 409 if taken
GET  /bookings         upcoming bookings with AI notes
```

## Running it locally

You need Node 18+ and a free Postgres database from [Neon](https://neon.tech). A Gemini key from [Google AI Studio](https://aistudio.google.com) is optional; without it the app uses template text.

Backend:

```bash
cd backend
cp .env.example .env     # Windows: copy .env.example .env
# put your Neon DATABASE_URL (and GEMINI_API_KEY if you have one) in .env
npm install
npm run db:push          # creates the tables
npm run db:seed          # adds some sample slots
npm run start:dev        # http://localhost:3000
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

The frontend talks to `http://localhost:3000` unless you set `VITE_API_URL` in `frontend/.env`.

To try it: publish a slot as the coach, book it as a champion, then check the coach view for the prep note. To test double booking, open two windows and book the same slot in both, then you'll see a notification about already booked slot.

## AI tools I used

I used Claude (Anthropic) to brainstorm the concept and to write most of the code, then ran and tested everything on my own machine. Not everything worked the first time: the Gemini model I started with returned 404, and the next one was timing out, so I switched to `gemini-flash-lite-latest` and raised the timeout to 30 seconds. Inside the app, Gemini writes the confirmation and the coach's prep note.

## What I would add next

- login for the coach/AI champion
- cancel/reschedule option
- send the confirmation by email with a calendar invite
- Google Calendar sync so slots that clash with existing events are hidden
- recurring availability ("every Tuesday 14:00 to 16:00")
- tests, especially one that fires two bookings at the same time
- a month calendar view and a time zone picker
