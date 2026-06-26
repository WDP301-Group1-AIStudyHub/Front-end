export const DEFAULT_SUBJECT_COLOR = "#ffd166";

function expandHex(hex: string) {
  const raw = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toLowerCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return raw.toLowerCase();
  }

  return null;
}

export function normalizeSubjectColor(color?: string | null) {
  const expanded = color ? expandHex(color) : null;
  return expanded ? `#${expanded}` : DEFAULT_SUBJECT_COLOR;
}

export function getReadableSubjectText(color?: string | null) {
  const normalized = normalizeSubjectColor(color).slice(1);
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const linear = [red, green, blue].map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];

  return luminance > 0.58 ? "#263126" : "#fffef8";
}

export function getSubjectColorLabel(color?: string | null) {
  const normalized = normalizeSubjectColor(color);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) return "Moon";

  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) % 6;
  if (max === green) hue = (blue - red) / delta + 2;
  if (max === blue) hue = (red - green) / delta + 4;
  hue = Math.round(hue * 60 + 360) % 360;

  if (hue < 30 || hue >= 330) return "Clay";
  if (hue < 90) return "Amber";
  if (hue < 170) return "Sage";
  if (hue < 250) return "Mist";
  return "Mauve";
}
