"use client";

import { trpc } from "@/lib/trpc/client";
import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useToast } from "@/lib/toast/ToastProvider";
import { Composer } from "@/components/Composer";
import { MessageBubble } from "@/components/MessageBubble";
import { ThemeToggleFloating } from "@/components/ThemeToggleFloating";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type MessageItem = RouterOutputs["message"]["list"][number];

export default function ChatPage() {
  const { user } = useUser()
  const utils = trpc.useUtils();
  const { push } = useToast();
  const { data: sessions } = trpc.session.list.useQuery({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const messageInput = useMemo(
    () => (activeSessionId === null ? { sessionId: 0 } : { sessionId: activeSessionId }),
    [activeSessionId]
  );

  const { data: messages, isLoading: messagesLoading, error: messagesError } =
    trpc.message.list.useQuery(messageInput, { enabled: activeSessionId !== null });

  const createSession = trpc.session.create.useMutation({
    onSuccess: async (s) => {
      await utils.session.list.invalidate();
      setActiveSessionId(s.id);
    },
    onError: (e) => push(e.message || "Failed to create session"),
  });

  const deleteSession = trpc.session.delete.useMutation({
    onSuccess: async () => {
      await utils.session.list.invalidate();
      setActiveSessionId(null);
    },
    onError: (e) => push(e.message || "Failed to delete session"),
  });

  const updateTitle = trpc.session.updateTitle.useMutation({
    onError: (e) => push(e.message || "Failed to rename session"),
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
        const title = (ctx.content || "").slice(0, 60);
        updateTitle.mutate({ id: activeSessionId, title });
        await utils.session.list.invalidate();
      }
    },
    onError: (e) => push(e.message || "Failed to send message"),
    onSettled: () => setIsTyping(false),
  });

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    //If no active session → create one first, then send
    if (!activeSessionId) {
      createSession.mutate({}, {
        onSuccess: (s) => {
          sendMessage.mutate({ sessionId: s.id, content: text });
        },
      });
    } else {
      sendMessage.mutate({ sessionId: activeSessionId, content: text });
    }
  };

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
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
                  <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
                    {activeSessionId && messagesLoading && (
                      <p className="text-center text-sm text-muted-foreground">
                        Loading messages…
                      </p>
                    )}

                    {activeSessionId && messagesError && (
                      <p className="text-center text-sm text-destructive">
                        Failed to load messages: {messagesError.message}
                      </p>
                    )}

                    {activeSessionId && !messagesLoading && (!messages || messages.length === 0) && (
                      <p className="text-center text-sm text-muted-foreground">
                        No messages yet. Start by typing below
                      </p>
                    )}

                    {messages?.map((m: MessageItem) => (
                      <MessageBubble key={m.id} message={m} />
                    ))}

                    {isTyping && (
                      <div className="mx-auto w-full max-w-3xl opacity-70 italic text-center">
                        Assistant is typing…
                      </div>
                    )}
                  </div>
                </div>

                {/* Composer placement */}
                {!activeSessionId ? (
                  // No session yet → show centered composer
                  <div className="flex-1 flex flex-col items-center justify-start p-4 text-center gap-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Hello, {user?.fullName || user?.username || "User"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Navigate your career with clarity.
                    </p>
                    <Composer
                      onSend={handleSend}
                      position="center"
                      placeholder="Ask anything about your career..."
                    />
                  </div>
                ) : !messagesLoading && messages?.length === 0 ? (
                  // Session exists but no messages yet
                  <div className="flex-1 flex items-center justify-center p-4">
                    <Composer
                      sessionId={activeSessionId}
                      onSend={handleSend}
                      position="center"
                      placeholder="Ask anything about your career..."
                    />
                  </div>
                ) : (
                  // Ongoing conversation
                  <Composer
                    sessionId={activeSessionId}
                    onSend={handleSend}
                    position="bottom"
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
