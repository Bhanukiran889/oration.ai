type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function getCareerReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Hello, I am your career guide.';
  }

  try {
    // Insert a system-style instruction to force Markdown output
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `
      You are a **Career Guidance Assistant**. Your role is ONLY to provide **career-related advice, guidance, and insights**.  
      Do NOT answer questions outside the scope of career counseling (e.g., personal life, entertainment, politics).  
      
      ### Formatting Rules:
      - Always reply in **structured, professional Markdown**.  
      - Use clear **headings (##, ###)**, **bullet points**, and **bold keywords**.  
      - Where appropriate, use **tables**, **checklists**, or **numbered steps**.  
      - For examples, commands, or skill-building paths, use fenced code blocks such as:
      
      \`\`\`bash
      # Example of learning roadmap
      1. Learn HTML, CSS, JS
      2. Move to React.js
      3. Practice with projects
      \`\`\`
      
      - Keep responses **concise, actionable, and tailored** to the career context.  
      - If multiple options exist, present them in **pros/cons format**.  
      - Always end with a **clear next step or recommendation**.  
      `,

    };

    // Merge system + user messages
    const allMessages = [systemPrompt, ...messages];

    // Convert into Gemini's expected format
    const contents = allMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user', // Gemini uses "user" or "model"
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Gemini API error', res.status, errText);
      return 'Hello, I am your career guide.';
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text ?? 'Hello, I am your career guide.';
  } catch (e) {
    console.error('Gemini request failed', e);
    return 'Hello, I am your career guide.';
  }
}
