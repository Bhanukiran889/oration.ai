import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export type Context = {
  user: { authId: string; id: number; email: string | null; name: string | null } | null;
};

export const createContext = async ({ req }: { req: Request }): Promise<Context> => {
  // Get the authenticated Clerk user id (if any) from the request
  const { userId: clerkUserId } = getAuth(req as any);
  if (!clerkUserId) {
    return { user: null };
  }

  const user = await prisma.user.upsert({
    where: { authId: clerkUserId },
    update: {},
    create: { authId: clerkUserId },
    select: { id: true, authId: true, email: true, name: true },
  });

  return { user };
};

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});


