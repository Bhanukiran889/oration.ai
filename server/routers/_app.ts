import { router } from '@/server/trpc';
import { chatRouter } from '@/server/routers/chat';

export const appRouter = router({
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;


