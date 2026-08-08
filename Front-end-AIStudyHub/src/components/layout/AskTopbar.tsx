import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontalIcon,
  PanelRightIcon,
  PinIcon,
  PlusIcon,
  PencilIcon,
  FileTextIcon,
  FileCodeIcon,
  Trash2Icon,
} from "lucide-react";
import { SourcesOverlay } from "@/components/chat/sources/SourcesAside";
import { useAuiState, useThreadListItemRuntime } from "@assistant-ui/react";
import { getStoredUser } from "@/services/authStorage";
import { useChatThreadStore } from "@/store/useChatThreadStore";
import { useNavigate } from "react-router-dom";

export interface AskTopbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  sessionTitle?: string;
  createdBy?: string;
  lastUpdated?: string;
  onPin?: () => void;
  onAddToProject?: () => void;
  onRenameSession?: () => void;
  onExportPdf?: () => void;
  onExportMarkdown?: () => void;
  onExportDocx?: () => void;
  onDeleteSession?: () => void;
}

export function AskTopbar({
  sessionTitle,
  createdBy,
  lastUpdated,
  onPin,
  onAddToProject,
  onRenameSession,
  onExportPdf,
  onExportMarkdown,
  onExportDocx,
  onDeleteSession,
}: AskTopbarProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();

  const threadListItem = useAuiState(
    (s) =>
      (
        s as unknown as {
          threadListItem?: {
            remoteId?: string;
            title?: string;
            lastMessageAt?: Date;
          };
        }
      ).threadListItem,
  );
  const threadListItemRuntime = useThreadListItemRuntime();

  const storedUser = getStoredUser();

  const displayTitle = sessionTitle ?? threadListItem?.title ?? "New Session";
  const displayCreatedBy =
    createdBy ?? (storedUser?.fullName || storedUser?.email || "You");
  const displayLastUpdated =
    lastUpdated ??
    (threadListItem?.lastMessageAt
      ? new Date(threadListItem.lastMessageAt).toLocaleDateString()
      : "Just now");

  const handleRenameClick = () => {
    if (onRenameSession) {
      onRenameSession();
    } else {
      setRenameValue(displayTitle);
      setIsRenaming(true);
    }
  };

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== displayTitle) {
      if (threadListItem?.remoteId) {
        await useChatThreadStore
          .getState()
          .rename(threadListItem.remoteId, trimmed);
      } else {
        threadListItemRuntime?.rename?.(trimmed);
      }
    }
    setIsRenaming(false);
  };

  const handleDeleteConfirm = async () => {
    if (onDeleteSession) {
      onDeleteSession();
    } else if (threadListItem?.remoteId) {
      await useChatThreadStore.getState().remove(threadListItem.remoteId);
      navigate("/ask");
    } else {
      threadListItemRuntime?.delete?.();
      navigate("/ask");
    }
  };

  return (
    <header className="flex w-full items-center justify-between border-b bg-background px-4 py-2">
      <div />

      {/* Right Action Controls */}
      <div className="flex items-center gap-2">
        <AlertDialog>
          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="More session options"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {/* Session Metadata Header Card */}
              <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5 text-xs">
                {isRenaming ? (
                  <input
                    aria-label="Rename session"
                    className="h-7 w-full rounded border bg-background px-2 text-xs font-normal outline-none"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") setIsRenaming(false);
                    }}
                    autoFocus
                  />
                ) : (
                  <p className="line-clamp-3 leading-snug text-foreground/90 font-normal">
                    {displayTitle}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1 text-muted-foreground">
                  <span>Created by</span>
                  <span className="font-medium text-foreground">
                    {displayCreatedBy}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Last Updated</span>
                  <span className="font-medium text-foreground">
                    {displayLastUpdated}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* General Actions */}
              <DropdownMenuItem
                disabled
                onClick={onPin}
                className="cursor-not-allowed opacity-50"
              >
                <PinIcon className="mr-2 size-4" />
                Pin
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                onClick={onAddToProject}
                className="cursor-not-allowed opacity-50"
              >
                <PlusIcon className="mr-2 size-4" />
                Add to project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleRenameClick}
                className="cursor-pointer"
              >
                <PencilIcon className="mr-2 size-4" />
                Rename Session
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Export Actions (Disabled pending backend implementation) */}
              <DropdownMenuItem
                disabled
                onClick={onExportPdf}
                className="cursor-not-allowed opacity-50"
              >
                <FileTextIcon className="mr-2 size-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                onClick={onExportMarkdown}
                className="cursor-not-allowed opacity-50"
              >
                <FileCodeIcon className="mr-2 size-4" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                onClick={onExportDocx}
                className="cursor-not-allowed opacity-50"
              >
                <FileTextIcon className="mr-2 size-4" />
                Export as DOCX
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Destructive Delete wrapped in AlertDialog */}
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <Trash2Icon className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete session?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This chat session will be
                permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mobile Sources Toggle */}
        <div className="lg:hidden">
          <SourcesOverlay>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Toggle sources overlay"
            >
              <PanelRightIcon className="size-4" />
            </Button>
          </SourcesOverlay>
        </div>
      </div>
    </header>
  );
}
