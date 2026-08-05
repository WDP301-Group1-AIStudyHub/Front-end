export type PromptCommand = {
  id: string;
  menuLabel: string;
  chipLabel: string;
  description: string;
  icon: string;
  prompt: string;
};

export const PROMPT_COMMANDS: readonly PromptCommand[] = [
  {
    id: "flashcards",
    menuLabel: "/flashcards",
    chipLabel: "Flashcards",
    description: "Draft a flashcard set",
    icon: "flashcards",
    prompt: "Create a set of flashcards from my study documents.",
  },
  {
    id: "quiz",
    menuLabel: "/quiz",
    chipLabel: "Quiz",
    description: "Draft a practice quiz",
    icon: "quiz",
    prompt: "Create a 5-question quiz from my study documents.",
  },
  {
    id: "mindmap",
    menuLabel: "/mindmap",
    chipLabel: "Mindmap",
    description: "Map the key concepts",
    icon: "mindmap",
    prompt: "Create a mindmap of the key concepts in my study documents.",
  },
  {
    id: "report",
    menuLabel: "/report",
    chipLabel: "Report",
    description: "Write a structured summary",
    icon: "report",
    prompt: "Write a report summarizing the key points of my study documents.",
  },
  {
    id: "table",
    menuLabel: "/table",
    chipLabel: "Table",
    description: "Compare concepts in a table",
    icon: "table",
    prompt: "Create a comparison table of the key concepts in my study documents.",
  },
];

export function applyCommandToText(
  command: PromptCommand,
  text: string,
): string {
  const trimmed = text.trim();
  return trimmed ? `${command.prompt}\n\n${trimmed}` : command.prompt;
}

export function findCommandByPrefix(
  text: string,
): { command: PromptCommand; rest: string } | null {
  for (const command of PROMPT_COMMANDS) {
    if (text.startsWith(command.prompt)) {
      let rest = text.slice(command.prompt.length);
      if (rest.startsWith("\n\n")) {
        rest = rest.slice(2);
      }
      return { command, rest };
    }
  }
  return null;
}
