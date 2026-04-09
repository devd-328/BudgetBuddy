import { useState, useCallback, useEffect } from "react";
import { callBudgetAgent } from "../lib/groq";
import { supabase } from "../lib/supabase";

export function useBudgetAI() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("budget_ai_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("budget_ai_history", JSON.stringify(history));
  }, [history]);

  // 🗣️ Text to Speech Function
  const speak = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean text for speech (remove JSON and special chars)
    const cleanText = text.replace(/\[ACTION:.*\]/g, "").trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // 🛠️ Action Executor (Database Mutations)
  const executeAction = useCallback(async (actionObj, userId) => {
    if (!userId) return { error: "User not authenticated" };

    const { action, data } = actionObj;

    try {
      // 1. Transactions (Income/Expense)
      if (action === "ADD_TRANSACTION") {
        const { error } = await supabase.from("transactions").insert([{
          user_id: userId,
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: new Date().toISOString().split("T")[0]
        }]);
        if (error) throw error;
      } 
      
      // 2. Debts & Loans (Lent/Owed)
      else if (action === "ADD_DEBT") {
        const { error } = await supabase.from("debts").insert([{
          user_id: userId,
          person_name: data.person_name,
          amount: data.amount,
          remaining_amount: data.amount,
          repayments: [],
          type: data.type,
          reason: data.reason || "No reason provided",
          status: "active",
          date: new Date().toISOString().split("T")[0]
        }]);
        if (error) throw error;
      } 
      
      // 3. Log Repayment (Advanced Tracking)
      else if (action === "LOG_REPAYMENT") {
        // Find the active debt for this person
        const { data: debt, error: fErr } = await supabase
          .from("debts")
          .select("*")
          .ilike("person_name", data.person_name)
          .eq("user_id", userId)
          .eq("status", "active")
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fErr || !debt) {
          return { error: `I couldn't find an active record for ${data.person_name}.` };
        }

        const currentRepayments = Array.isArray(debt.repayments) ? debt.repayments : [];
        const newRepayments = [...currentRepayments, { 
          amount: data.amount, 
          date: new Date().toISOString().split("T")[0] 
        }];
        const currentRemaining = debt.remaining_amount !== null ? Number(debt.remaining_amount) : Number(debt.amount);
        const newRemainingAmount = Math.max(0, currentRemaining - Number(data.amount));
        const newStatus = newRemainingAmount <= 0 ? 'settled' : 'active';

        const { error: uErr } = await supabase
          .from("debts")
          .update({
            repayments: newRepayments,
            remaining_amount: newRemainingAmount,
            status: newStatus
          })
          .eq("id", debt.id);
        
        if (uErr) throw uErr;
      }

      // 4. Settle Debt (Manual/Write-off)
      else if (action === "SETTLE_DEBT") {
        const { error } = await supabase
          .from("debts")
          .update({ 
            status: "settled",
            remaining_amount: 0 
          })
          .ilike("person_name", data.person_name)
          .eq("user_id", userId)
          .eq("status", "active"); 
        
        if (error) throw error;
      }

      // 4. Budgets
      else if (action === "SET_BUDGET") {
        // Find category ID first
        const { data: catData } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", data.category)
          .eq("user_id", userId)
          .single();

        if (catData) {
          const { error } = await supabase.from("budgets").upsert({
            user_id: userId,
            category_id: catData.id,
            limit_amount: data.limit,
            month: data.month || new Date().getMonth() + 1,
            year: data.year || new Date().getFullYear()
          }, { onConflict: 'user_id,category_id,month,year' });
          if (error) throw error;
        } else {
          return { error: `Category "${data.category}" not found.` };
        }
      }

      // 5. Deletions
      else if (action === "DELETE_TRANSACTION") {
        const { error } = await supabase.from("transactions").delete().eq("id", data.id);
        if (error) throw error;
      } else if (action === "DELETE_DEBT") {
        const { error } = await supabase.from("debts").delete().eq("id", data.id);
        if (error) throw error;
      } else if (action === "RESET_FOR_NEW_MONTH") {
        const { error: tErr } = await supabase.from('transactions').delete().eq('user_id', userId);
        const { error: dErr } = await supabase.from('debts').delete().eq('user_id', userId);
        const { error: bErr } = await supabase.from('budgets').delete().eq('user_id', userId);
        
        if (tErr || dErr || bErr) throw new Error("Failed to clear some tables.");
        
        window.dispatchEvent(new CustomEvent('budget-update'));
        return { success: true };
      }

      return { success: true };
    } catch (err) {
      console.error("Action Execution Failed:", err);
      return { error: err.message };
    }
  }, []);

  const chat = useCallback(async (userMessage, userId, shouldSpeak = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch latest financial context to feed the AI
      let contextString = "";
      if (userId) {
        const [{ data: txs }, { data: debts }] = await Promise.all([
          supabase.from('transactions').select('type, amount').eq('user_id', userId),
          supabase.from('debts').select('type, remaining_amount, person_name').eq('user_id', userId).eq('status', 'active')
        ]);
        
        let totalIncome = 0.0;
        let totalExpense = 0.0;
        if (txs) {
          totalIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
          totalExpense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        }
        
        let contextText = `User's Current balances (DO NOT mention explicitly unless asked):\n`;
        contextText += `- Total Income: ${totalIncome}\n`;
        contextText += `- Total Expense: ${totalExpense}\n`;
        contextText += `- Overall Balance: ${totalIncome - totalExpense}\n`;
        
        const categoryExpenses = {};
        if (txs) {
          txs.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || "Other";
            categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Number(t.amount);
          });
        }
        if (Object.keys(categoryExpenses).length > 0) {
           contextText += `- Expenses by Category: ${Object.entries(categoryExpenses).map(([c, amt]) => `${c}: ${amt}`).join(', ')}\n`;
        }
        
        if (debts && debts.length > 0) {
          contextText += `- Active Debts: ${debts.map(d => `${d.person_name} (${d.type}): ${d.remaining_amount} remaining`).join(', ')}\n`;
        } else {
          contextText += `- No active debts tracking.\n`;
        }
        contextString = contextText;
      }

      const reply = await callBudgetAgent(userMessage, history, contextString);
      
      // Parse for actions: [ACTION: {"action": "...", "data": {...}}]
      const actionMatch = reply.match(/\[ACTION:\s*({.*?})\]/);
      let actionResult = null;

      if (actionMatch) {
        try {
          const actionObj = JSON.parse(actionMatch[1]);
          actionResult = await executeAction(actionObj, userId);
        } catch (e) {
          console.error("Failed to parse AI action JSON:", e);
        }
      }

      const displayReply = reply.replace(/\[ACTION:.*\]/g, "").trim();

      setHistory((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: displayReply },
      ]);
      
      if (shouldSpeak) {
        speak(displayReply);
      }

      return { text: displayReply, actionResult };
    } catch (err) {
      console.error("AI Chat Error:", err);
      setError(err.message || "Failed to get AI response");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [history, executeAction, speak]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("budget_ai_history");
    window.speechSynthesis?.cancel();
  }, []);

  return { chat, speak, isSpeaking, loading, history, error, clearHistory };
}
