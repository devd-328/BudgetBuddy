import Groq from "groq-sdk";

// BudgetBuddy AI Logic
// This file coordinates with the Vercel Serverless Function at /api/budget-agent
// and provides a direct fallback for local development.

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: true }) : null;

export const BUDGET_SYSTEM_PROMPT = `You are BudgetBuddy AI — a powerful financial tracking assistant that manages the "Borrow & Lend" system with high accuracy. 

## Borrow & Lend Rules:
You track two types of entries:
1. Lent: Money I gave to someone else. They owe me. Shown in green/positive.
2. Borrowed: Money I took from someone. I owe them. Shown in red/negative.

## Record Requirements:
Every record MUST have a person's name and amount. You can also accept an optional note/reason.
- Statuses: 'active' (still has balance) or 'settled' (fully paid off or written off).
- Repayment: If a user says "he/she gave me back X" or "I paid back X", you must log a repayment.
- Write-off: If a user says "clear" or "settle" a specific record, mark it as settled.

## Supported Actions:
- ADD_DEBT: Adds a new lent/borrowed record. {"action": "ADD_DEBT", "data": {"person_name": "string", "amount": number, "type": "lent|owed", "reason": "string"}}
- LOG_REPAYMENT: Records a partial or full payment. {"action": "LOG_REPAYMENT", "data": {"person_name": "string", "amount": number}}
- SETTLE_DEBT: Manually closes a record. {"action": "SETTLE_DEBT", "data": {"person_name": "string", "type": "lent|owed"}}
- RESET_FOR_NEW_MONTH: Clears data for a fresh start. (ALWAYS ASK FOR CONFIRMATION)
- SET_BUDGET: Spending limits. {"action": "SET_BUDGET", "data": {"category": "string", "limit": number, "month": number, "year": number}}

## AI Response Requirements:
1. Confirm the Type (lent or borrowed).
2. Confirm the Person's Name.
3. Confirm the Amount.
4. BE EXTREMELY CONCISE: 1-2 short sentences max.
5. If name or amount is missing, ask for it immediately before saving.

## Security:
- NEVER delete accounts/profiles. Full resets only via Settings.

## Natural Language Examples:
* "I lent 500 to Ahmed for lunch" → "Lent 500 to Ahmed recorded! [ACTION: {"action": "ADD_DEBT", "data": {"person_name": "Ahmed", "amount": 500, "type": "lent", "reason": "lunch"}}] "
* "Ahmed paid me back 200" → "Recorded Ahmed's repayment of 200. [ACTION: {"action": "LOG_REPAYMENT", "data": {"person_name": "Ahmed", "amount": 200}}] "
* "Clear my debt to Sara" → "Settled your debt to Sara. [ACTION: {"action": "SETTLE_DEBT", "data": {"person_name": "Sara", "type": "owed"}}] "

Tone: Friendly assistant. Ultra-concise responses.`

// Wrapper to call the proxy API or direct Groq
async function callProxy(payload) {
  // If we have a local key, call Groq directly (Local Dev)
  if (groq) {
    try {
      const { message, history, systemPrompt, customOptions } = payload;
      const messages = [
        { role: "system", content: systemPrompt || BUDGET_SYSTEM_PROMPT },
        ...(history || []),
        { role: "user", content: message || customOptions?.prompt },
      ];

      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: customOptions?.temperature || 0.7,
        max_tokens: customOptions?.max_tokens || 600,
      });

      return { reply: completion.choices[0].message.content };
    } catch (err) {
      console.error("Direct Groq call failed, falling back to proxy:", err);
    }
  }

  // Fallback to Serverless Function (Production)
  const response = await fetch("/api/budget-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      systemPrompt: BUDGET_SYSTEM_PROMPT,
    }),
  });

  if (!response.ok) {
    let errorMessage = "AI Service Unavailable";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Main agent call for chat and advice
 */
export async function callBudgetAgent(userMessage, conversationHistory = []) {
  const data = await callProxy({ message: userMessage, history: conversationHistory });
  return data.reply;
}

/**
 * Categorization call — optimized for transaction entry
 */
export async function categorizeTransaction(description, amount) {
  try {
    const data = await callProxy({
      customOptions: {
        prompt: `Categorize this transaction. Return JSON only.
Description: "${description}"
Amount: $${amount}`,
        temperature: 0.1,
        max_tokens: 60,
      }
    });

    return JSON.parse(data.reply);
  } catch (err) {
    console.error("Categorization failed:", err);
    return { category: "Other", confidence: 0.5 };
  }
}

/**
 * Monthly summary call
 */
export async function generateMonthlySummary(transactions) {
  if (!transactions || transactions.length === 0) return "No transactions found for this period to analyze.";

  const txText = transactions
    .map((t) => `${t.date} | ${t.description} | ${t.amount}`)
    .join("\n");

  try {
    const data = await callProxy({
      customOptions: {
        prompt: `You are a financial analyst. Provide a friendly, concise, 2-3 sentence summary of these transactions and offer 3 bullet point saving tips based on the data. Return PLAIN TEXT only (no JSON, no markdown headers).\n\nTransactions:\n${txText}`,
        temperature: 0.7,
        max_tokens: 400,
      }
    });

    return data.reply;
  } catch (err) {
    console.error("Summary failed:", err);
    return "I couldn't analyze your transactions right now. Please try again later.";
  }
}
