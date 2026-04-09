import Groq from "groq-sdk";

// BudgetBuddy AI Logic
// This file coordinates with the Vercel Serverless Function at /api/budget-agent
// and provides a direct fallback for local development.

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: true }) : null;

export const BUDGET_SYSTEM_PROMPT = `You are BudgetBuddy AI — an advanced financial tracking assistant. You manage both General Transactions (Income/Expense) and "Borrow & Lend" (Debt) records.

## General Transaction Rules:
1. Income/Expense: If the user says they spent money or earned money, record it.
2. Provide a type ('income' or 'expense'), an amount, a reasonable core category (e.g. 'Food', 'Transport', 'Salary', 'Shopping', 'Bills'), and a short description.

## Borrow & Lend Rules (Debts):
You track two types of debt entries:
1. Lent: Money given to someone else (They owe me).
2. Borrowed: Money taken from someone (I owe them).
- Debt names and amounts are mandatory.
- Repayment: If a user says "paid me back" or "I paid back", log a repayment.
- Settle: If a user says "clear" or "settle", mark the debt as settled.

## Supported Database Actions (Output as JSON inside [ACTION: { ... }]):
- ADD_TRANSACTION: {"action": "ADD_TRANSACTION", "data": {"type": "income|expense", "amount": number, "category": "string", "description": "string"}}
- ADD_DEBT: {"action": "ADD_DEBT", "data": {"person_name": "string", "amount": number, "type": "lent|owed", "reason": "string"}}
- LOG_REPAYMENT: {"action": "LOG_REPAYMENT", "data": {"person_name": "string", "amount": number}}
- SETTLE_DEBT: {"action": "SETTLE_DEBT", "data": {"person_name": "string", "type": "lent|owed"}}
- SET_BUDGET: {"action": "SET_BUDGET", "data": {"category": "string", "limit": number, "month": number, "year": number}}
- RESET_FOR_NEW_MONTH: Clears data for a fresh start. (ALWAYS ASK FOR CONFIRMATION FIRST)

## Answering Questions (Real-time Context):
You will be provided with the user's real-time financial context (Income, Expenses, Balance, Active Debts). Use this context directly to answer questions like "What is my current income?" or "Who owes me money?". Do NOT say you don't have access. Do NOT make up numbers not in the context.

## Response Requirements:
1. Be extremely concise (1-2 sentences).
2. Friendly, helpful tone.
3. If logging an action, confirm the details to the user and append the [ACTION: ...] block at the very end of your message.
4. If details (like amount or name) are missing for an action, ask for them immediately before appending an action block.

## Examples:
* "I spent 500 on dinner" → "Recorded your 500 expense for Food. [ACTION: {"action": "ADD_TRANSACTION", "data": {"type": "expense", "amount": 500, "category": "Food", "description": "dinner"}}] "
* "I lent 500 to Ahmed for lunch" → "Lent 500 to Ahmed recorded! [ACTION: {"action": "ADD_DEBT", "data": {"person_name": "Ahmed", "amount": 500, "type": "lent", "reason": "lunch"}}] "
* "Ahmed paid me back 200" → "Recorded Ahmed's repayment of 200. [ACTION: {"action": "LOG_REPAYMENT", "data": {"person_name": "Ahmed", "amount": 200}}] "
* "What is my balance?" → "Your current balance is 1200 (Total income: 2000, Total expense: 800)."`

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
      systemPrompt: payload.systemPrompt || BUDGET_SYSTEM_PROMPT,
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
export async function callBudgetAgent(userMessage, conversationHistory = [], additionalContext = "") {
  let prompt = BUDGET_SYSTEM_PROMPT;
  if (additionalContext) {
    prompt += `\n\n## Real-Time User Context (Use this to answer queries about their status):\n${additionalContext}`;
  }
  
  const data = await callProxy({ 
    message: userMessage, 
    history: conversationHistory,
    systemPrompt: prompt
  });
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
