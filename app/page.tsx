"use client";

import { trpc } from '@/lib/trpc/client';
import { useMemo, useState } from 'react';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server/routers/_app';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type SessionItem = RouterOutputs['session']['list'][number];
type MessageItem = RouterOutputs['message']['list'][number];

export default function ChatPage() {
  const utils = trpc.useUtils();
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = trpc.session.list.useQuery({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messageInput = useMemo(() => (activeSessionId === null ? { sessionId: 0 } : { sessionId: activeSessionId }), [activeSessionId]);
  const { data: messages, isLoading: messagesLoading, error: messagesError } = trpc.message.list.useQuery(messageInput, { enabled: activeSessionId !== null });
  const createSession = trpc.session.create.useMutation({
    onSuccess: async (s) => {
      await utils.session.list.invalidate();
      setActiveSessionId(s.id);
    },
  });
  const deleteSession = trpc.session.delete.useMutation({
    onSuccess: async () => {
      await utils.session.list.invalidate();
      setActiveSessionId(null);
    },
  });
  const sendMessage = trpc.message.sendMessage.useMutation({
    onSuccess: async () => {
      await utils.message.list.invalidate(messageInput);
    },
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: 'calc(100vh - 60px)' }}>
      <SignedOut>
        <div style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div>
            <p>Please sign in to view your chats.</p>
            <SignInButton mode="modal">
              <button>Sign in</button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
      <aside style={{ borderRight: '1px solid #eee', padding: 12, overflowY: 'auto' }}>
        <button onClick={() => createSession.mutate({})} disabled={createSession.isPending}>+ New Chat</button>
        {sessionsLoading && <p style={{ marginTop: 12 }}>Loading sessions…</p>}
        {sessionsError && (
          <p style={{ marginTop: 12, color: 'crimson' }}>
            Failed to load sessions: {sessionsError.message}
          </p>
        )}
        {!sessionsLoading && (!sessions || sessions.length === 0) && <p style={{ marginTop: 12 }}>No sessions yet.</p>}
        <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sessions?.map((s: SessionItem) => {
            const isActive = s.id === activeSessionId;
            return (
              <li key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setActiveSessionId(s.id)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    background: isActive ? '#eef' : 'transparent',
                    border: '1px solid #ddd',
                    padding: '6px 8px',
                    borderRadius: 6,
                  }}
                >
                  {s.title ?? `Session ${s.id}`}
                </button>
                <button
                  onClick={() => deleteSession.mutate({ id: s.id })}
                  title="Delete"
                  disabled={deleteSession.isPending}
                  style={{ border: '1px solid #ddd', padding: '6px 8px', borderRadius: 6 }}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {!activeSessionId && <p>Select or create a chat.</p>}
          {activeSessionId && messagesLoading && <p>Loading messages…</p>}
          {activeSessionId && messagesError && (
            <p style={{ color: 'crimson' }}>Failed to load messages: {messagesError.message}</p>
          )}
          {activeSessionId && !messagesLoading && (!messages || messages.length === 0) && <p>No messages yet. Say hello!</p>}
          {messages?.map((m: MessageItem) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
        {activeSessionId && (
          <Composer
            sessionId={activeSessionId}
            onSend={(text) => sendMessage.mutate({ sessionId: activeSessionId, content: text })}
          />
        )}
      </main>
      </SignedIn>
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

function MessageBubble({ message }: { message: MessageItem }) {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        margin: '8px 0',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          background: isUser ? '#daf0ff' : '#f2f2f2',
          border: '1px solid #ddd',
          padding: '8px 10px',
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{isUser ? 'You' : 'Assistant'}</div>
        <div>{message.content}</div>
      </div>
    </div>
  );
}