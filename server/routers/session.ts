import { authedProcedure, router } from '@/server/trpc';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionTitle } from '@/lib/getSessionTitle';

export const sessionRouter = router({
  list: authedProcedure.query(async ({ ctx }) => {
    return prisma.session.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }),

  create: authedProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const session = await prisma.session.create({
        data: {
          userId: ctx.user!.id,
          title: input?.title ?? 'New Chat',
        },
      });
      return session;
    }),

  updateTitle: authedProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.session.update({
        where: { id: input.id, userId: ctx.user!.id } as any,
        data: { title: input.title },
      });
      return updated;
    }),

  delete: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.session.deleteMany({ where: { id: input.id, userId: ctx.user!.id } });
      return { ok: true };
    }),

  // Summarize session title with AI
  summarizeTitle: authedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const title = await getSessionTitle(input.messages);
      return { title };
    }),
});
