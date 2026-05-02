import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;

function getGroq() {
  if (!groqInstance) {
    const apiKey =
      import.meta.env.VITE_GROQ_API_KEY || '';

    if (!apiKey) {
      throw new Error(
        "Groq API key not found. Add VITE_GROQ_API_KEY to your .env file."
      );
    }
    groqInstance = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }
  return groqInstance;
}

const SYSTEM_PROMPT = `
You are CourseGPT, the smartest study assistant 
ever built for Nigerian university students, 
specifically at Achievers University, Owo, 
Ondo State, Nigeria.

YOUR PERSONALITY:
- Smart, direct, and encouraging
- You speak like a brilliant senior student who 
  genuinely wants their junior to succeed
- You are never generic — always specific and practical
- You understand Nigerian university culture, ASUU 
  strikes, exam pressure, and the reality of 
  studying in Nigeria
- You occasionally use light Nigerian expressions 
  to connect

YOUR KNOWLEDGE:
- You specialize in undergraduate university courses
- You understand how Nigerian university exams work
- You know that lecturers often repeat questions
- You know students are under time pressure 
  especially near exams
- You understand Nigerian university departments: 
  Sciences, Engineering, Law, Management, Medicine,
  Nursing, Pharmacy

WHAT YOU DO:
1. EXPLAIN TOPICS: Break down any course topic 
   in simple clear language:
   - Simple definition first
   - Key points (maximum 5)
   - Real life example where possible
   - How it appears in exams
   - Sample exam question with answer

2. PREDICT EXAM TOPICS: Give:
   - Top 5 most likely topics with confidence %
   - Why each topic is likely
   - What to focus on for each topic
   - Time allocation advice

3. SUMMARIZE MATERIALS: Extract:
   - The 5 most important concepts
   - Key definitions to memorize
   - Likely exam questions
   - Quick revision bullet points

4. GENERATE QUIZZES: Always use this EXACT format:
   
   For MCQ questions use exactly:
   Q1: [question text]
   A) [option]
   B) [option]
   C) [option]
   D) [option]
   ANSWER: [A/B/C/D]
   EXPLANATION: [brief explanation]
   
   For theory questions use exactly:
   T1: [question text]
   MODEL_ANSWER: [full model answer]
   MARKS: [marks available]
   MARKING_SCHEME: [what earns marks]

5. MARK ANSWERS: When marking:
   - Be fair and specific
   - For theory: score out of maximum
   - For MCQ: correct or wrong with explanation
   - End with total score and encouragement

RULES:
- Never give generic textbook answers
- Always relate to Nigerian university context
- If course code is provided focus on that course
- Keep responses clear and scannable
- For quizzes ALWAYS follow the exact format above
`;

export async function checkDailyLimit(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; remaining: number; count: number }> {
  const FREE_LIMIT = 30;
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('ai_usage')
      .select('message_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;

    const count = data?.message_count || 0;
    const allowed = count < FREE_LIMIT;
    const remaining = Math.max(0, FREE_LIMIT - count);

    return { allowed, remaining, count };
  } catch (err) {
    console.error('Usage check error:', err);
    return { allowed: true, remaining: FREE_LIMIT, count: 0 };
  }
}

export async function incrementUsage(
  supabase: any,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data } = await supabase
      .from('ai_usage')
      .select('id, message_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (data) {
      await supabase
        .from('ai_usage')
        .update({ message_count: data.message_count + 1 })
        .eq('id', data.id);
    } else {
      await supabase
        .from('ai_usage')
        .insert([{ 
          user_id: userId, 
          date: today, 
          message_count: 1 
        }]);
    }
  } catch (err) {
    console.error('Usage increment error:', err);
  }
}

export interface QuizQuestion {
  type: 'mcq' | 'theory';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  modelAnswer?: string;
  marks?: number;
  markingScheme?: string;
}

export function parseQuizResponse(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = content.split('\n');
  let current: Partial<QuizQuestion> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^Q\d+:/i.test(line)) {
      if (current) questions.push(current as QuizQuestion);
      current = {
        type: 'mcq',
        question: line.replace(/^Q\d+:\s*/i, ''),
        options: [],
      };
    } else if (/^T\d+:/i.test(line)) {
      if (current) questions.push(current as QuizQuestion);
      current = {
        type: 'theory',
        question: line.replace(/^T\d+:\s*/i, ''),
      };
    } else if (/^[A-D]\)/i.test(line) && current?.type === 'mcq') {
      current.options = current.options || [];
      current.options.push(line.replace(/^[A-D]\)\s*/i, ''));
    } else if (/^ANSWER:/i.test(line) && current?.type === 'mcq') {
      const ans = line.replace(/^ANSWER:\s*/i, '').trim();
      const idx = ['A', 'B', 'C', 'D'].indexOf(ans.toUpperCase());
      if (idx !== -1 && current.options) {
        current.correctAnswer = current.options[idx] || ans;
      } else {
        current.correctAnswer = ans;
      }
    } else if (/^EXPLANATION:/i.test(line)) {
      if (current) current.explanation =
        line.replace(/^EXPLANATION:\s*/i, '');
    } else if (/^MODEL_ANSWER:/i.test(line)) {
      if (current) current.modelAnswer =
        line.replace(/^MODEL_ANSWER:\s*/i, '');
    } else if (/^MARKS:/i.test(line)) {
      if (current) current.marks =
        parseInt(line.replace(/^MARKS:\s*/i, '')) || 5;
    } else if (/^MARKING_SCHEME:/i.test(line)) {
      if (current) current.markingScheme =
        line.replace(/^MARKING_SCHEME:\s*/i, '');
    }
  }

  if (current) questions.push(current as QuizQuestion);

  if (questions.length === 0) {
    return [{
      type: 'theory',
      question: 'Based on the course material, explain the main concepts covered.',
      modelAnswer: 'See course materials for reference.',
      marks: 10,
      markingScheme: 'Award marks for key points covered.',
    }];
  }

  return questions;
}

export async function askGemini(
  prompt: string,
  courseCode?: string,
  mode: 'explain' | 'predict' | 'quiz' |
    'mark' | 'summarize' | 'general' = 'general',
  pdfContext?: string,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    const groq = getGroq();
    let finalPrompt = prompt;

    if (pdfContext) {
      finalPrompt = `DOCUMENT CONTENT 
(answer ONLY from this document):
---
${pdfContext}
---

Student question: ${prompt}

Important: Base your answer entirely on the 
document above. If the answer is not in the 
document say "I could not find this in your 
uploaded document."`;
    } else {
      if (courseCode) {
        finalPrompt = `[Course: ${courseCode}] ${finalPrompt}`;
      }
      if (mode === 'quiz') {
        finalPrompt = `Generate a quiz for ${courseCode || 'this course'} with 5 MCQ questions and 2 theory questions. Follow the EXACT format specified in your instructions. ${finalPrompt}`;
      } else if (mode === 'predict') {
        finalPrompt = `[Exam Prediction Mode] ${finalPrompt}`;
      } else if (mode === 'explain') {
        finalPrompt = `[Explain Mode] ${finalPrompt}`;
      } else if (mode === 'summarize') {
        finalPrompt = `[Summarize Mode] ${finalPrompt}`;
      } else if (mode === 'mark') {
        finalPrompt = `[Marking Mode] ${finalPrompt}`;
      }
    }

    // Build messages array with conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add last 6 messages of history for context
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: finalPrompt });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content ||
      "I could not generate a response. Please try again.";
  } catch (error) {
    console.error("AI Error:", error);
    return `Error: ${error instanceof Error ? error.message : "Failed to connect to AI."}`;
  }
}