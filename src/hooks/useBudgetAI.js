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
          type: data.type,
          reason: data.reason || "No reason provided",
          status: "pending"
        }]);
        if (error) throw error;
      } 
      
      // 3. Update/Settle Debt
      else if (action === "UPDATE_DEBT") {
        const { error } = await supabase
          .from("debts")
          .update({ status: data.status })
          .ilike("person_name", data.person_name)
          .eq("user_id", userId)
          .eq("status", "pending"); // Only settle pending ones
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
      const reply = await callBudgetAgent(userMessage, history);
      
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
