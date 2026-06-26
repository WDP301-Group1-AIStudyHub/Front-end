import { useStudyMaterialStore } from "../../store/useStudyMaterialStore";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, X, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudyMaterialNotificationTray() {
  const notifications = useStudyMaterialStore((state) => state.notifications);
  const dismissNotification = useStudyMaterialStore((state) => state.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] w-full max-w-sm flex flex-col gap-3 pointer-events-none">
      {notifications.map((notif) => {
        const isSuccess = notif.status === "COMPLETED";

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto w-full rounded-2xl border bg-card p-4 shadow-[0_16px_40px_rgba(73,107,85,0.18)] transition-all animate-in slide-in-from-bottom-5 duration-300 ${
              isSuccess
                ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10"
                : "border-red-500/20 bg-red-500/5 dark:bg-red-500/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {isSuccess ? (
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Brain className="size-3 text-primary" />
                    AI Study Assistant
                  </span>
                  <button
                    onClick={() => dismissNotification(notif.id)}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-lg transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-foreground truncate">
                  {isSuccess ? "Study Materials Ready" : "Generation Failed"}
                </h4>
                <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
                  {isSuccess
                    ? `Your generated set "${notif.title}" is complete.`
                    : notif.error || "An error occurred during quiz generation."}
                </p>

                {isSuccess && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      asChild
                      className="text-2xs font-bold"
                      onClick={() => dismissNotification(notif.id)}
                    >
                      <Link to={`/library/study/${notif.id}`}>
                        Practice Now
                        <ArrowRight className="size-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
