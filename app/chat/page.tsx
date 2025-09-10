"use client";

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';

export default function ChatPage() {
  const { data: sessions } = trpc.chat.listSessions.useQuery({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const { data: messages } = trpc.chat.getSessionMessages.useQuery(
    activeSessionId ? { sessionId: activeSessionId } : ({} as any),
    { enabled: !!activeSessionId },
  );
  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (s) => setActiveSessionId(s.id),
  });
  const sendMessage = trpc.chat.sendMessage.useMutation();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: 'calc(100vh - 60px)' }}>
      <aside style={{ borderRight: '1px solid #eee', padding: 12, overflowY: 'auto' }}>
        <button onClick={() => createSession.mutate({})}>+ New Chat</button>
        <ul style={{ marginTop: 12 }}>
          {sessions?.map((s) => (
            <li key={s.id}>
              <button onClick={() => setActiveSessionId(s.id)}>{s.title ?? `Session ${s.id}`}</button>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {!activeSessionId && <p>Select or create a chat.</p>}
          {messages?.map((m) => (
            <div key={m.id} style={{ margin: '8px 0' }}>
              <b>{m.role === 'user' ? 'You' : 'AI'}: </b>
              <span>{m.content}</span>
            </div>
          ))}
        </div>
        {activeSessionId && <Composer sessionId={activeSessionId} onSend={(text) => sendMessage.mutate({ sessionId: activeSessionId, userMessage: text })} />}
      </main>
    </div>
  );
}

function Composer({ sessionId, onSend }: { sessionId: number; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText('');
      }}
      style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." style={{ flex: 1 }} />
      <button type="submit">Send</button>
    </form>
  );
}


