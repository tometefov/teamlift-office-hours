import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiInput {
  name: string;
  note: string;
  startsAt: Date;
  durationMinutes: number;
}

export interface AiTexts {
  /** Friendly message shown to the champion who booked. */
  confirmation: string;
  /** Short prep note shown to the coach. */
  coachSummary: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Asks Gemini for two short texts in one call. If there is no API key,
   * or the call fails or times out, it falls back to template text so the
   * booking flow always completes.
   */
  async generate(input: AiInput): Promise<AiTexts> {
    const when = input.startsAt.toLocaleString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const fallback = this.fallback(input.name, input.note, when);

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) return fallback;
    const model = this.config.get<string>('GEMINI_MODEL') || 'gemini-flash-lite-latest';

    const prompt = `You support an AI-adoption coaching program. An "AI champion" from a client team
booked a ${input.durationMinutes}-minute 1:1 session with their coach on ${when}.

Champion's name: ${input.name}
What they are stuck on: """${input.note}"""

Reply with JSON only, in this exact shape:
{"confirmation": "...", "coachSummary": "..."}

- confirmation: 1-2 warm sentences to ${input.name}. Mention the time and suggest one thing to bring.
- coachSummary: 1-2 sentences for the coach: the topic, the core problem, and one thing to prepare.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (!res.ok) {
        this.logger.warn(`Gemini responded ${res.status}. Using fallback text.`);
        return fallback;
      }
      const data: any = await res.json();
      const parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
      return {
        confirmation: parsed.confirmation || fallback.confirmation,
        coachSummary: parsed.coachSummary || fallback.coachSummary,
      };
    } catch (err) {
      this.logger.warn(`Gemini call failed (${String(err)}). Using fallback text.`);
      return fallback;
    }
  }

  private fallback(name: string, note: string, when: string): AiTexts {
    return {
      confirmation: `Hi ${name}, you're booked for ${when}. Bring one real example of the task you're working on and we'll make progress on it together.`,
      coachSummary: `${name} wants help with: "${note}". Prepare one concrete example to work through.`,
    };
  }
}
