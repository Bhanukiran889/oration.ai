import React from 'react'

const aside = () => {
  return (
    <div>
      <aside className="flex min-h-0 flex-col overflow-y-auto border-r bg-sidebar p-3 text-sidebar-foreground">


<Button
  onClick={() => createSession.mutate({})}
  disabled={createSession.isPending}
  variant="outline"
  className="w-full justify-center"
>
  + New Chat
</Button>

{sessionsLoading && <p className="mt-3 text-sm text-muted-foreground">Loading sessions…</p>}
{sessionsError && (
  <p className="mt-3 text-sm text-destructive">Failed to load sessions: {sessionsError.message}</p>
)}
{!sessionsLoading && (!sessions || sessions.length === 0) && (
  <p className="mt-3 text-sm text-muted-foreground">No sessions yet.</p>
)}
<ul className="mt-3 flex flex-col gap-1 chat-scroll flex-1 overflow-y-auto p-4 pb-32 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
  {sessions?.map((s: SessionItem) => {
    const isActive = s.id === activeSessionId;
    return (
      <li key={s.id} className="flex items-center gap-1">

        {/* Session select button */}
        <Button
          variant={isActive ? "secondary" : "outline"}
          className="flex-1 truncate justify-start"
          onClick={() => setActiveSessionId(s.id)}
        >
          {s.title ?? `Session ${s.id}`}
        </Button>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          disabled={deleteSession.isPending}
          onClick={() => deleteSession.mutate({ id: s.id })}
        >
          <Trash className="h-4 w-4" />
        </Button>

      </li>
    );
  })}
</ul>
<div className="mt-auto border-t pt-3">
  <div className="flex items-center gap-3 p-2">
    <UserButton afterSignOutUrl="/" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{user?.fullName || user?.username || 'User'}</p>
      <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  </div>
  <SignedOut>
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign in</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign up</Button>
      </SignUpButton>
    </div>
  </SignedOut>
</div>
</aside>
    </div>
  )
}

export default aside
