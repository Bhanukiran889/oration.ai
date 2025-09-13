import fetch from "node-fetch";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function getSessionTitle(messages: ChatMessage[]): Promise<string> {
  try {
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `
You are a session title generator.
Rules:
- Generate a very short title (max 4 words).
- Summarize the overall topic of the conversation.
- Do NOT use greetings like "Hello" or "Hi".
- Use concise, professional wording.
`,
    };
    const allMessages = [systemPrompt, ...messages];

    const apiKey = process.env.AI_TITLE_AI_KEY;
    if (!apiKey) return "New Conversation";

    const contents = allMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 50 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Gemini title API error", res.status, errText);
      return "not ok";
    }

    const data: any = await res.json();
    console.log("Raw Gemini response:", JSON.stringify(data, null, 2));

    const title: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return title || "no text";
  } catch (e) {
    console.error("Gemini title request failed", e);
    return "New Conversation";
  }
}

// // ✅ Call the function to test it
// (async () => {
//   const title = await getSessionTitle([
//     { role: "user", content: "I want to learn React and get a frontend job." },
//     { role: "assistant", content: "Sure! I can guide you." },
//   ]);

//   console.log("Generated title:", title);
// })();
