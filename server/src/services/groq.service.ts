import { env } from '../config/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface GlanceStatsForAI {
  periodType: 'day' | 'week';
  label: string;
  totalMinutes: number;
  previousTotalMinutes: number;
  entryCount: number;
  activeDays: number;
  projects: Array<{ name: string; minutes: number; taskNames: string[] }>;
}

export interface AIGlance {
  summary: string;
  tips: string;
}

/**
 * Ask Groq for a short recap + time-management tip based on aggregate
 * numbers only. Returns null on any failure — the glance page works
 * without AI content.
 */
export async function generateGlanceSummary(stats: GlanceStatsForAI): Promise<AIGlance | null> {
  const system =
    'You are a friendly, concise productivity coach inside a time-tracking app called "boosted". ' +
    'You are given aggregate time-tracking stats for a user. Respond ONLY with JSON: ' +
    '{"summary": string, "tips": string}. ' +
    '"summary": 2-3 sentences recapping how they spent the period — mention the top activities by name and total time, and compare to the previous period if meaningful. ' +
    '"tips": 1-2 sentences with one specific, encouraging time-management suggestion based on the data. ' +
    'Use plain language, hours-and-minutes phrasing ("2h 15m"), no emoji, no markdown.';

  const body = {
    model: MODEL,
    temperature: 0.6,
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(stats) },
    ],
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('[groq] request failed:', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Partial<AIGlance>;
    if (typeof parsed.summary !== 'string' || typeof parsed.tips !== 'string') return null;
    return { summary: parsed.summary.trim(), tips: parsed.tips.trim() };
  } catch (err) {
    console.error('[groq] error:', err instanceof Error ? err.message : err);
    return null;
  }
}
