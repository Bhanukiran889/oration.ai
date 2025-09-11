import { authedProcedure, router } from '@/server/trpc';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


export const messageRouter = router({
  list: authedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ensure session belongs to user
      const session = await prisma.session.findFirst({ where: { id: input.sessionId, userId: ctx.user!.id } });
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const session = await prisma.session.findFirst({ where: { id: input.sessionId, userId: ctx.user!.id } });
      if (!session) throw new Error('NOT_FOUND');
      const userMsg = await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          role: 'user',
          content: input.content,
        },
      });

      const assistantContent = 'Hello, I am your career guide.';

      const assistantMsg = await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          role: 'assistant',
          content: assistantContent,
        },
      });

      await prisma.session.update({
        where: { id: input.sessionId },
        data: { updatedAt: new Date() },
      });

      return { user: userMsg, assistant: assistantMsg };
    }),
});


