"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type SessionItem = {
  id: number;
  title: string | null;
};

type AppSidebarProps = {
  sessions: SessionItem[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onNewChat: () => void;
  onDeleteSession: (id: number) => void;
  isDeleting?: boolean;
};

export function AppSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isDeleting,
}: AppSidebarProps) {
  const { user } = useUser();

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader>
        <Button onClick={onNewChat} className="w-full" variant="outline">
          + New Chat
        </Button>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <ScrollArea className="h-[70vh]">
            <SidebarMenu>
              {sessions?.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <SidebarMenuItem key={s.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelectSession(s.id)}
                      className="justify-between"
                    >
                      <span className="truncate">
                        {s.title ?? `Session ${s.id}`}
                      </span>

                      {/* Delete with confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isDeleting}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Chat?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The chat will be
                              permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteSession(s.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <Avatar>
            <UserButton />
          </Avatar>
          <div className="flex flex-col min-w-0">
            <p className="truncate text-sm font-medium">
              {user?.fullName || user?.username || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
