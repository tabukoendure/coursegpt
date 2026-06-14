import { supabase } from './supabase';

// ─── PLAN LIMITS (internal — never shown to user) ────────────────────────────
export const INTERNAL_LIMITS: Record<string, number> = {
  free: 10,
  pro: 50,
  premium: 200,
};

// ─── THROTTLE (fair usage) ───────────────────────────────────────────────────
const recentMessages: Record<string, number[]> = {};

export function shouldThrottle(userId: string): boolean {
  const now = Date.now();
  const window = 30000;
  const maxInWindow = 5;
  if (!recentMessages[userId]) recentMessages[userId] = [];
  recentMessages[userId] = recentMessages[userId].filter(t => now - t < window);
  recentMessages[userId].push(now);
  return recentMessages[userId].length > maxInWindow;
}

export function getThrottleDelay(userId: string): number {
  const count = recentMessages[userId]?.length || 0;
  if (count > 8) return 3000;
  if (count > 5) return 1500;
  return 0;
}

// ─── FILE HASHING ────────────────────────────────────────────────────────────
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── PDF TEXT CACHE ──────────────────────────────────────────────────────────
export async function getCachedPdfText(fileHash: string): Promise<{ text: string; pages: number } | null> {
  try {
    const { data } = await supabase
      .from('pdf_cache')
      .select('extracted_text, page_count')
      .eq('file_hash', fileHash)
      .maybeSingle();
    if (data) {
      await supabase
        .from('pdf_cache')
        .update({ last_used_at: new Date().toISOString() })
        .eq('file_hash', fileHash);
      return { text: data.extracted_text, pages: data.page_count };
    }
    return null;
  } catch {
    return null;
  }
}

export async function cachePdfText(
  fileHash: string,
  text: string,
  pages: number,
  fileSizeBytes: number
): Promise<void> {
  try {
    await supabase.from('pdf_cache').upsert({
      file_hash: fileHash,
      extracted_text: text,
      page_count: pages,
      file_size_bytes: fileSizeBytes,
      use_count: 1,
      last_used_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('PDF cache write error:', err);
  }
}

// ─── AI RESPONSE CACHE ───────────────────────────────────────────────────────
export async function getCachedResponse(
  pdfHash: string,
  question: string,
  toolType: string
): Promise<string | null> {
  try {
    const cacheKey = await hashString(`${pdfHash}:${toolType}:${normalizeQuestion(question)}`);
    const { data } = await supabase
      .from('ai_response_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .maybeSingle();
    if (data) {
      await supabase
        .from('ai_response_cache')
        .update({ last_used_at: new Date().toISOString() })
        .eq('cache_key', cacheKey);
      return data.response;
    }
    return null;
  } catch {
    return null;
  }
}

export async function cacheResponse(
  pdfHash: string,
  question: string,
  toolType: string,
  response: string
): Promise<void> {
  try {
    if (!pdfHash) return;
    if (response.length < 100) return;
    const cacheKey = await hashString(`${pdfHash}:${toolType}:${normalizeQuestion(question)}`);
    await supabase.from('ai_response_cache').upsert({
      cache_key: cacheKey,
      response,
      tool_type: toolType,
      use_count: 1,
      last_used_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Response cache write error:', err);
  }
}

// ─── SMART PDF CHUNKING ──────────────────────────────────────────────────────
export function getRelevantChunks(pdfText: string, question: string, maxChars = 1500): string {
  if (pdfText.length <= maxChars) return pdfText;
  const chunkSize = 400;
  const chunks: string[] = [];
  for (let i = 0; i < pdfText.length; i += chunkSize) {
    chunks.push(pdfText.substring(i, i + chunkSize));
  }
  const questionWords = question.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.replace(/[^a-z]/g, ''));
  const scored = chunks.map((chunk, idx) => {
    const chunkLower = chunk.toLowerCase();
    const score = questionWords.reduce((acc, word) => acc + (chunkLower.includes(word) ? 1 : 0), 0);
    return { chunk, score, idx };
  });
  const topChunks = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.ceil(maxChars / chunkSize))
    .sort((a, b) => a.idx - b.idx)
    .map(c => c.chunk);
  return topChunks.join(' ').substring(0, maxChars);
}

// ─── COMPRESS CONVERSATION HISTORY ──────────────────────────────────────────
export function compressHistory(
  history: { role: 'user' | 'assistant'; content: string }[]
): { role: 'user' | 'assistant'; content: string }[] {
  if (history.length <= 6) return history;
  const recent = history.slice(-4);
  const old = history.slice(0, -4);
  const summary = old
    .map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content.substring(0, 100)}`)
    .join(' | ');
  const summaryMsg: { role: 'user'; content: string } = {
    role: 'user',
    content: `[Previous context summary: ${summary}]`,
  };
  return [summaryMsg, ...recent];
}

// ─── GEMINI FLASH ────────────────────────────────────────────────────────────
export async function askGeminiFlash(prompt: string, systemContext?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not found');
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const fullPrompt = systemContext ? `${systemContext}\n\n${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

// ─── SMART AI ROUTER ─────────────────────────────────────────────────────────
export function shouldUseGemini(toolType: string, hasPdf: boolean, promptLength: number): boolean {
  // Keep everything on Groq — better quality responses
  return false;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function hashString(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 100);
}
