import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useStudyMaterialStore } from "@/store/useStudyMaterialStore";

export default function StudyMaterialNotificationTray() {
  const notifications = useStudyMaterialStore((state) => state.notifications);
  const dismissNotification = useStudyMaterialStore(
    (state) => state.dismissNotification,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (notifications.length === 0) return;

    notifications.forEach((notif) => {
      if (notif.status === "COMPLETED") {
        toast.success("Study Materials Ready", {
          description: `Your generated set "${notif.title}" is complete.`,
          action: {
            label: "Practice Now",
            onClick: () => navigate(`/library/study/${notif.id}`),
          },
        });
      } else if (notif.status === "FAILED") {
        toast.error("Generation Failed", {
          description: notif.error || "An error occurred during generation.",
        });
      }
      dismissNotification(notif.id);
    });
  }, [notifications, dismissNotification, navigate]);

  return null;
}
