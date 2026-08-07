import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { CelestialInlineLoader } from "@/components/shared/CelestialLoading";
import { Button } from "@/components/ui/button";
import { AiCredentialSettings } from "@/components/settings/AiCredentialSettings";
import { PageShell } from "@/components/layout/PageShell";
import { updateProfile } from "@/services/authApi";
import {
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from "@/services/authStorage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UserProfilePage() {
  const storedUser = getStoredUser();

  // Split stored full name into First Name and Last Name
  const initialNameParts = (storedUser?.fullName ?? "").trim().split(" ");
  const initialFirstName = initialNameParts[0] ?? "";
  const initialLastName = initialNameParts.slice(1).join(" ") ?? "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [avatar, setAvatar] = useState(storedUser?.avatar ?? "");
  const [showAvatarUrlInput, setShowAvatarUrlInput] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const updated = await updateProfile({ fullName, avatar });
      const token = getStoredToken();
      if (token) storeAuthSession(token, updated);

      setSaved(true);
      toast.success("Profile saved successfully");
      savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size must be less than 2 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
          toast.success("Avatar image uploaded");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    toast.info("Avatar image removed");
  };

  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "U";

  return (
    <PageShell variant="narrow" className="py-8 space-y-8">
      {/* Hidden file input for avatar upload */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      <PageHeader title="Settings" />

      {/* SECTION 2: PROFILE */}
      <section className="space-y-2">
        <h2 className="text-sm font-normal text-muted-foreground px-4">
          Profile
        </h2>

        {/* Card 1: Email, Profile Image, First Name, Last Name */}
        <Card className="p-0">
          <CardContent className="p-0 divide-y">
            {/* Email Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-4 py-4 gap-2 sm:gap-4">
              <label className="w-44 shrink-0 text-sm font-normal text-muted-foreground">
                Email
              </label>
              <span className="text-sm text-foreground font-normal truncate">
                {storedUser?.email ?? "phamanhduyqb@gmail.com"}
              </span>
            </div>

            {/* Profile Image Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-4 py-4 gap-3 sm:gap-4">
              <label className="w-44 shrink-0 text-sm font-normal text-muted-foreground">
                Profile Image
              </label>
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <div className="size-9 rounded-full overflow-hidden border border-border/80 bg-muted shrink-0 flex items-center justify-center font-medium text-xs text-foreground">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile Avatar"
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Upload image
                </Button>

                {avatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    type="button"
                  >
                    Remove
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAvatarUrlInput(!showAvatarUrlInput)}
                  type="button"
                >
                  {showAvatarUrlInput ? "Hide URL" : "Paste URL"}
                </Button>

                <span className="text-xs text-muted-foreground/70 ml-auto sm:ml-2">
                  PNG, JPEG, or WebP up to 2 MB
                </span>
              </div>
            </div>

            {/* Optional inline avatar URL input */}
            {showAvatarUrlInput && (
              <div className="px-4 py-3 bg-muted/20 flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-ring"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setShowAvatarUrlInput(false)}
                >
                  Done
                </Button>
              </div>
            )}

            {/* First Name Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3.5 gap-2 sm:gap-4">
              <label className="w-44 shrink-0 text-sm font-normal text-muted-foreground">
                First Name
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Duy"
              />
            </div>

            {/* Last Name Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3.5 gap-2 sm:gap-4">
              <label className="w-44 shrink-0 text-sm font-normal text-muted-foreground">
                Last Name
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pham Anh"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feedback Messages */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Settings saved successfully.
          </div>
        )}

        {/* Bottom Right Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            variant={"outline"}
          >
            {saving ? <CelestialInlineLoader label="Saving..." /> : "Save"}
          </Button>
        </div>
      </section>

      {/* SECTION 3: BYOK / AI CREDENTIALS */}
      <section className="space-y-3">
        <h2 className="text-sm font-normal text-muted-foreground px-4">
          AI Credentials (Bring Your Own Key)
        </h2>
        <AiCredentialSettings />
      </section>
    </PageShell>
  );
}
