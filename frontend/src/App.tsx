import { useState } from "react";
import { ChampionView } from "./components/ChampionView";
import { CoachView } from "./components/CoachView";

type Role = "champion" | "coach";

export default function App() {
  const [role, setRole] = useState<Role>("champion");

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Office Hours for AI Champions</p>
        <h1>Get unstuck with your AI coach</h1>
        <p className="lead">
          Book a 1:1 with your coach and tell them what you're working on. AI turns your note into a
          prep summary, so the session starts with answers instead of questions.
        </p>
      </header>

      <div className="tabs" role="tablist" aria-label="View as">
        <button role="tab" aria-selected={role === "champion"} onClick={() => setRole("champion")}>
          I'm a champion
        </button>
        <button role="tab" aria-selected={role === "coach"} onClick={() => setRole("coach")}>
          I'm the coach
        </button>
      </div>

      <main>{role === "champion" ? <ChampionView /> : <CoachView />}</main>

      <footer>React + TypeScript · NestJS · PostgreSQL · Gemini — built for the TeamLift challenge</footer>
    </div>
  );
}
