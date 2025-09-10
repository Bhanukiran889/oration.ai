import { publicProcedure, router } from '@/server/trpc';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const chatRouter = router({
  listSessions: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const sessions = await prisma.chatSession.findMany({
        where: input?.userId ? { userId: input.userId } : undefined,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      });
      return sessions;
    }),

  getSessionMessages: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const messages = await prisma.message.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { createdAt: 'asc' },
      });
      return messages;
    }),

  createSession: publicProcedure
    .input(z.object({ userId: z.number().optional(), title: z.string().optional() }))
    .mutation(async ({ input }) => {
      const session = await prisma.chatSession.create({
        data: {
          userId: input.userId ?? 0,
          title: input.title ?? 'New Career Chat',
        },
      });
      return session;
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        userMessage: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      // Save user message
      const userMsg = await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          role: 'user',
          content: input.userMessage,
        },
      });

      // Generate AI reply (placeholder)
      const aiReply = await generateCareerAdviceReply(input.sessionId, input.userMessage);

      // Save assistant message
      const assistantMsg = await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          role: 'assistant',
          content: aiReply,
        },
      });

      await prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { updatedAt: new Date() },
      });

      return { user: userMsg, assistant: assistantMsg };
    }),
});

async function generateCareerAdviceReply(sessionId: number, userMessage: string): Promise<string> {
  // TODO: Replace with OpenAI/Together/etc. For now, rule-based placeholder.
  const lower = userMessage.toLowerCase();
  if (lower.includes('resume')) {
    return 'Consider tailoring your resume to each role, emphasizing measurable impact.';
  }
  if (lower.includes('interview')) {
    return 'Practice STAR responses and research the company and role expectations.';
  }
  return 'Thanks for sharing. Could you tell me your top 2-3 career goals?';
}


