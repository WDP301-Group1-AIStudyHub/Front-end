import { type FC, useEffect, useRef } from "react";
import { unstable_useComposerInput, useAuiState } from "@assistant-ui/react";
import type { PromptCommand } from "./promptCommands";
import { CommandChip } from "./CommandChip";

export type ComposerCommandOverlayProps = {
  command?: PromptCommand | null;
  onRemove?: () => void;
};

export const ComposerCommandOverlay: FC<ComposerCommandOverlayProps> = ({
  command,
  onRemove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setText } = unstable_useComposerInput();
  // Read the live store value rather than `unstable_useComposerInput().value`,
  // which reports "" whenever the composer is not in editing state.
  const composerText = useAuiState((s) => s.composer.text);

  // Selecting a command leaves a lone space behind: the library's directive
  // insertion always appends one, and our formatter serializes to "". Clearing
  // it restores the placeholder and stops the caret starting one column in.
  //
  // Deliberately keyed on `command` alone. Including `value` would re-run on
  // every keystroke and wipe a line the user is intentionally spacing out; this
  // should fire once, at selection time.
  useEffect(() => {
    if (!command) return;
    // Deferred by a tick and read off the DOM: at mount the store snapshot
    // still reports the pre-insertion text, and the library commits its own
    // setText during the same event. Reading the textarea afterwards is the
    // only view guaranteed to be current.
    const timer = setTimeout(() => {
      const textarea = containerRef.current?.parentElement?.querySelector(
        "textarea",
      );
      const current = textarea?.value ?? composerText;
      if (current.length > 0 && current.trim() === "") {
        setText("");
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !command) return;

    const shell =
      el.closest<HTMLElement>('[data-slot="aui_composer-shell"]') ??
      el.closest<HTMLElement>(".aui-composer-root");

    const updateIndent = () => {
      if (!el || !shell) return;
      const width = el.getBoundingClientRect().width;
      const indent = width > 0 ? width + 6 : 0;
      shell.style.setProperty(
        "--composer-first-line-indent",
        `${Math.ceil(indent)}px`,
      );
    };

    updateIndent();

    const observer = new ResizeObserver(updateIndent);
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (shell) {
        shell.style.setProperty("--composer-first-line-indent", "0px");
      }
    };
  }, [command]);

  if (!command) return null;

  return (
    <div
      ref={containerRef}
      // `start-2` matches the input's own `px-2`, so the chip lines up with
      // where the text begins. (`inset-inline-start-2` is not a Tailwind
      // utility — it silently resolved to no offset at all.)
      className="absolute start-2 top-1.5 z-10 flex items-center pointer-events-none select-none"
    >
      <CommandChip
        iconKey={command.icon}
        chipLabel={command.chipLabel}
        variant="composer"
        onRemove={onRemove}
      />
    </div>
  );
};
