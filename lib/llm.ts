type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function getCareerReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return 'Hello, I am your career guide.';
  }

  try {
    const envModel = process.env.OPENROUTER_MODEL?.trim();
    const models = [
      ...(envModel ? [envModel] : []),
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'google/gemma-7b-it:free',
      'gryphe/mythomax-l2-13b:free',
      'nousresearch/nous-hermes-2-mixtral-8x7b-sft:free',
    ];
    for (const model of models) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Career Guide Chat',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('OpenRouter error', model, res.status, errText);
        continue;
      }
      const data = await res.json();
      const text: string | undefined = data?.choices?.[0]?.message?.content;
      if (text) return text;
    }
    return 'Hello, I am your career guide.';
  } catch (e) {
    console.error('OpenRouter request failed', e);
    return 'Hello, I am your career guide.';
  }
}


