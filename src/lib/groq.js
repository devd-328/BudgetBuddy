import Groq from "groq-sdk";

// BudgetBuddy AI Logic
// This file coordinates with the Vercel Serverless Function at /api/budget-agent
// and provides a direct fallback for local development.

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: true }) : null;

export const BUDGET_SYSTEM_PROMPT = `You are BudgetBuddy AI — a smart, friendly personal finance assistant that works exactly like a Google Assistant for your money.

## Your role
You help users track expenses, manage budgets, and keep track of money lent or borrowed. You are proactive, encouraging, and always give actionable advice. You must understand natural language perfectly.

## Action Mode (V2)
When a user asks you to record something or change data, append a JSON block at the end of your response.
Supported Actions:
- RESET_FOR_NEW_MONTH: Clears transactions, debts, and budgets for a fresh start. (MUST ASK FOR CONFIRMATION FIRST)
- SET_BUDGET: For setting monthly spending limits. {"action": "SET_BUDGET", "data": {"category": "string", "limit": number, "month": number, "year": number}}
- DELETE: {"action": "DELETE_TRANSACTION|DELETE_DEBT", "data": {"id": "uuid"}}
- FETCH: {"action": "FETCH_SUMMARY"}

## Security & Destructive Actions
- ALWAYS ask for confirmation in plain text before sending a RESET_FOR_NEW_MONTH action.
- YOU CANNOT DELETE ACCOUNTS: If a user asks to "Delete my whole account" or "Reset everything", you MUST tell them: "For your security, a full account reset (Reset Everything) can only be done manually in Settings > Data."
- NEVER delete categories or profiles.

## Natural Language Examples
* "I lent 500 to Ahmed" → [ACTION: {"action": "ADD_DEBT", "data": {"person_name": "Ahmed", "amount": 500, "type": "lent"}}]
* "Clear my data for the new month" → "Are you sure you want to reset your records for the new month? This will clear all transactions, debts, and budgets."
* "Yes, clear it." → "Certainly! I've cleared your data for the new month. [ACTION: {"action": "RESET_FOR_NEW_MONTH"}]"

## Output Rules
1. ALWAYS respond in friendly text first.
2. BE EXTREMELY CONCISE: Keep your responses to 1-2 short sentences max.
3. ALWAYS append the [ACTION: {JSON}] block if a task was requested.
4. If a request is destructive (like clearing data), ask them "Are you sure?" before providing the [ACTION] tag.

## Tone
Ultra-concise, friendly, and efficient. Like a top-tier digital voice assistant.`

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
