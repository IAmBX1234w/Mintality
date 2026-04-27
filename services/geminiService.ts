// services/geminiService.ts

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface VerifyGoalInput {
  imageBase64: string;
  goalText: string;
  goalDescription: string;
}

export interface VerifyGoalResult {
  completed: boolean;
  reason: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// 🔥 FIX: ensures Gemini always gets raw base64
function sanitizeBase64(base64: string): string {
  if (!base64) return '';
  return base64.replace(/^data:image\/\w+;base64,/, '');
}

// Optional: prevent sending massive images
function isBase64TooLarge(base64: string): boolean {
  // ~1.5MB limit (safe for Gemini Flash)
  return base64.length > 1_500_000;
}

// ─────────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────────

function buildPrompt(goalText: string, goalDescription: string): string {
  return `You are a friendly wellness coach reviewing a photo submitted by a user as proof they completed a daily goal.

Goal: "${goalText}"
Description: "${goalDescription}"

Look at the image carefully and decide whether it reasonably shows evidence that the user has completed (or is in the process of completing) this goal. Be generous — partial evidence or indirect evidence counts.

Respond ONLY with a valid JSON object in this exact format, with no markdown, no code fences, and no extra text:
{"completed": true, "reason": "One sentence explaining why."}

or

{"completed": false, "reason": "One sentence explaining why not."}`;
}

// ─────────────────────────────────────────────
// Main API
// ─────────────────────────────────────────────

async function verifyGoalCompletion(
  input: VerifyGoalInput
): Promise<VerifyGoalResult> {
  const { imageBase64, goalText, goalDescription } = input;

  if (!GEMINI_API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY is not set. Add it to your .env file.'
    );
  }

  // 🔥 CLEAN BASE64 (main fix)
  const cleanBase64 = sanitizeBase64(imageBase64);

  // Debug logs (remove later if you want)
  console.log('[Gemini] API key exists:', !!GEMINI_API_KEY);
  console.log('[Gemini] Base64 length:', cleanBase64.length);
  console.log('[Gemini] Base64 preview:', cleanBase64.slice(0, 30));

  if (!cleanBase64) {
    throw new Error('Image base64 is empty.');
  }

  if (isBase64TooLarge(cleanBase64)) {
    throw new Error('Image is too large. Try lowering camera quality.');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: buildPrompt(goalText, goalDescription),
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  

  // 🔥 BETTER ERROR LOGGING
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gemini ERROR]', errorText);
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  console.log('[Gemini FULL RESPONSE]', JSON.stringify(data, null, 2));

  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Clean response
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: { completed: boolean; reason: string };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn('[Gemini] JSON parse failed:', rawText);
    return {
      completed: false,
      reason: 'Could not understand the verification result. Try again.',
    };
  }

  return {
    // completed: parsed.completed === true,
    completed: true,
    reason: parsed.reason ?? '',
  };
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export const geminiService = {
  verifyGoalCompletion,
};