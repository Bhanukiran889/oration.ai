import { authedProcedure, router } from '@/server/trpc';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCareerReply } from '@/lib/llm';

export const messageRouter = router({
  list: authedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ensure session belongs to user
      const session = await prisma.session.findFirst({
        where: { id: input.sessionId, userId: ctx.user!.id },
      });
      if (!session) return [];
      return prisma.message.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { createdAt: 'asc' },
      });
    }),

  sendMessage: authedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session ownership
      const session = await prisma.session.findFirst({
        where: { id: input.sessionId, userId: ctx.user!.id },
      });
      if (!session) throw new Error('NOT_FOUND');

      // Save user message
      const userMsg = await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          role: 'user',
          content: input.content,
        },
      });

      // Fetch full chat history (user + assistant messages)
      const history = await prisma.message.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      });

      // Call LLM with full history (system prompt is inside getCareerReply)
      const assistantContent = await getCareerReply(
        history.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      );

      // Save assistant response
      const assistantMsg = await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          role: 'assistant',
          content: assistantContent,
        },
      });

      // Update session timestamp
      await prisma.session.update({
        where: { id: input.sessionId },
        data: { updatedAt: new Date() },
      });

      return { user: userMsg, assistant: assistantMsg };
    }),
});
