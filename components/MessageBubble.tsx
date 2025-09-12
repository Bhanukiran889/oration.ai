import { AppRouter } from "@/server/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';


type RouterOutputs = inferRouterOutputs<AppRouter>;
type MessageItem = RouterOutputs['message']['list'][number];

export function MessageBubble({ message }: { message: MessageItem }) {
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