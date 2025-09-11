import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export type Context = {
  user: { authId: string; id: number; email: string | null; name: string | null } | null;
};

export const createContext = async ({ req }: { req: Request }): Promise<Context> => {
  // Get the authenticated Clerk user id (if any)
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) {
    return { user: null };
  }

  // Ensure a Prisma User exists for this Clerk user
  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? null;
  const name = cu?.fullName ?? cu?.username ?? null;

  const user = await prisma.user.upsert({
    where: { authId: clerkUserId },
    update: { email, name },
    create: { authId: clerkUserId, email, name },
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
    throw new Error('UNAUTHORIZED');
  }
  return next({ ctx });
});


