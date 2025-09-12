"use client";

import { trpc } from '@/lib/trpc/client';
import { useMemo, useState } from 'react';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server/routers/_app';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useToast } from '@/lib/toast/ToastProvider';
import { Composer } from '@/components/Composer';
import { MessageBubble } from '@/components/MessageBubble';
import { ThemeToggleFloating } from '@/components/ThemeToggleFloating';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type MessageItem = RouterOutputs['message']['list'][number];

export default function ChatPage() {
  const utils = trpc.useUtils();
  const { push } = useToast();
  const { data: sessions } = trpc.session.list.useQuery({});
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
    <>
      {/* Signed Out View */}
      <SignedOut>
        <div className="flex items-center justify-center h-screen p-10">
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">Please sign in to view your chats.</p>
            <div className="flex items-center justify-center gap-2">
              <SignInButton mode="modal">
                <Button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="rounded-md border px-4 py-2">Sign up</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </SignedOut>

      {/* Signed In View */}
      <SignedIn>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-72 lg:w-80">
              <AppSidebar
                sessions={sessions || []}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewChat={() => createSession.mutate({})}
                onDeleteSession={(id) => deleteSession.mutate({ id })}
                isDeleting={deleteSession.isPending}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header for small screens */}
              <header className="flex items-center justify-between border-b p-2 md:hidden">
                <SidebarTrigger />
                <ThemeToggleFloating />
              </header>

              {/* Chat Area */}
              <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ThemeToggleFloating />
                <div className="flex-1 overflow-y-auto p-4 pb-32 chat-scroll scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
                  {!activeSessionId && <p className="text-sm text-muted-foreground">Select or create a chat.</p>}
                  {activeSessionId && messagesLoading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
                  {activeSessionId && messagesError && (
                    <p className="text-sm text-destructive">Failed to load messages: {messagesError.message}</p>
                  )}
                  {activeSessionId && !messagesLoading && (!messages || messages.length === 0) && (
                    <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                  )}
                  <div className="mx-auto w-full max-w-5xl">
                    {messages?.map((m: MessageItem) => (
                      <MessageBubble key={m.id} message={m} />
                    ))}
                  </div>
                  {isTyping && <div className="mx-auto w-full max-w-5xl opacity-70 italic mt-2">Assistant is typing…</div>}
                </div>

                {/* Composer */}
                {activeSessionId && (
                  <Composer
                    sessionId={activeSessionId}
                    onSend={(text) => sendMessage.mutate({ sessionId: activeSessionId, content: text })}
                  />
                )}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
