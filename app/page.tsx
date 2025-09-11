"use client";

import { trpc } from '@/lib/trpc/client';
import { useMemo, useState } from 'react';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server/routers/_app';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useToast } from '@/lib/toast/ToastProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type SessionItem = RouterOutputs['session']['list'][number];
type MessageItem = RouterOutputs['message']['list'][number];

export default function ChatPage() {
  const utils = trpc.useUtils();
  const { push } = useToast();
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = trpc.session.list.useQuery({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messageInput = useMemo(() => (activeSessionId === null ? { sessionId: 0 } : { sessionId: activeSessionId }), [activeSessionId]);
  const { data: messages, isLoading: messagesLoading, error: messagesError } = trpc.message.list.useQuery(messageInput, { enabled: activeSessionId !== null });
  const createSession = trpc.session.create.useMutation({
    onSuccess: async (s) => {
      await utils.session.list.invalidate();
      setActiveSessionId(s.id);
    },
    onError: (e) => push(e.message || 'Failed to create session'),
  });
  const deleteSession = trpc.session.delete.useMutation({
    onSuccess: async () => {
      await utils.session.list.invalidate();
      setActiveSessionId(null);
    },
    onError: (e) => push(e.message || 'Failed to delete session'),
  });
  const updateTitle = trpc.session.updateTitle.useMutation({
    onError: (e) => push(e.message || 'Failed to rename session'),
  });
  const [isTyping, setIsTyping] = useState(false);
  const sendMessage = trpc.message.sendMessage.useMutation({
    onMutate: async (vars) => {
      setIsTyping(true);
      const isFirst = !messages || messages.length === 0;
      return { isFirst, content: vars.content };
    },
    onSuccess: async (_data, _vars, ctx) => {
      await utils.message.list.invalidate(messageInput);
      if (ctx?.isFirst && activeSessionId) {
        const title = (ctx.content || '').slice(0, 60);
        updateTitle.mutate({ id: activeSessionId, title });
        await utils.session.list.invalidate();
      }
    },
    onError: (e) => push(e.message || 'Failed to send message'),
    onSettled: () => setIsTyping(false),
  });

  return (
    <div className="grid h-dvh grid-cols-[280px_1fr] overflow-hidden">
      <SignedOut>
        <div className="col-span-2 flex items-center justify-center p-10">
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">Please sign in to view your chats.</p>
            <div className="flex items-center justify-center gap-2">
              <SignInButton mode="modal">
                <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md border px-4 py-2">Sign up</button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
      <aside className="flex min-h-0 flex-col overflow-y-auto border-r bg-sidebar p-3 text-sidebar-foreground">
        <button
          onClick={() => createSession.mutate({})}
          disabled={createSession.isPending}
          className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          + New Chat
        </button>
        {sessionsLoading && <p className="mt-3 text-sm text-muted-foreground">Loading sessions…</p>}
        {sessionsError && (
          <p className="mt-3 text-sm text-destructive">Failed to load sessions: {sessionsError.message}</p>
        )}
        {!sessionsLoading && (!sessions || sessions.length === 0) && (
          <p className="mt-3 text-sm text-muted-foreground">No sessions yet.</p>
        )}
        <ul className="mt-3 flex flex-col gap-1 overflow-y-auto">
          {sessions?.map((s: SessionItem) => {
            const isActive = s.id === activeSessionId;
            return (
              <li key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSessionId(s.id)}
                  className={
                    'flex-1 truncate rounded-md border px-3 py-2 text-left text-sm hover:bg-accent ' +
                    (isActive ? 'bg-accent' : '')
                  }
                >
                  {s.title ?? `Session ${s.id}`}
                </button>
                <button
                  onClick={() => deleteSession.mutate({ id: s.id })}
                  title="Delete"
                  disabled={deleteSession.isPending}
                  className="rounded-md border px-2 py-2 text-sm hover:bg-accent"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto border-t pt-3">
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign up</button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </aside>
      <main className="flex min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {!activeSessionId && <p className="text-sm text-muted-foreground">Select or create a chat.</p>}
          {activeSessionId && messagesLoading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
          {activeSessionId && messagesError && (
            <p className="text-sm text-destructive">Failed to load messages: {messagesError.message}</p>
          )}
          {activeSessionId && !messagesLoading && (!messages || messages.length === 0) && (
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          )}
          <div className="mx-auto max-w-3xl">
            {messages?.map((m: MessageItem) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
          {isTyping && <div className="mx-auto max-w-3xl opacity-70 italic mt-2">Assistant is typing…</div>}
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

function Composer({ onSend }: { sessionId: number; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText('');
      }}
      className="border-t p-3"
    >
      <div className="relative mx-auto flex max-w-3xl items-center justify-center">
        <div className="flex w-full items-center gap-2 rounded-full border bg-background/80 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            className="w-full rounded-full bg-transparent px-2 py-2 text-sm outline-none"
          />
          <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            Send
          </button>
        </div>
      </div>
    </form>
  );
}

function MessageBubble({ message }: { message: MessageItem }) {
  const isUser = message.role === 'user';
  return (
    <div className={'flex ' + (isUser ? 'justify-end' : 'justify-start')}>
      {isUser ? (
        <div className="my-2 max-w-[70%] rounded-2xl border bg-primary/10 px-3 py-2">
          <div className="mb-1 text-xs opacity-70">You</div>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      ) : (
        <div className="my-3 w-full max-w-3xl">
          <div className="mb-1 text-xs opacity-70">Assistant</div>
          <div className="prose prose-invert max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}