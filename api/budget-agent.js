import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, systemPrompt, customOptions } = req.body;

  if (!message && !customOptions) {
    return res.status(400).json({ error: "No message or options provided" });
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      ...(history || []),
      { role: "user", content: message || customOptions?.prompt },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: customOptions?.temperature || 0.7,
      max_tokens: customOptions?.max_tokens || 600,
    });

    const reply = response.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: "AI unavailable", details: err.message });
  }
}
