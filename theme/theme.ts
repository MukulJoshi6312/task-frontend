export const lightTheme = {
  mode: "light" as const,
  bg: "#F4F1EA",
  surface: "#FFFFFF",
  surfaceAlt: "#FBF9F4",
  sheet: "#FFFFFF",
  ink: "#1C1A17",
  inkSoft: "#6B6359",
  inkFaint: "#A39A8C",
  line: "#E7E1D6",
  accent: "#FF6B4A",
  accentInk: "#FFFFFF",
  accentSoft: "#FFEDE7",
  chipBg: "#FFFFFF",
  chipActive: "#1C1A17",
  chipActiveInk: "#F4F1EA",
  danger: "#FF5A4A",
  backdrop: "rgba(28,26,23,.34)",
};

export const darkTheme = {
  mode: "dark" as const,
  bg: "#15130F",
  surface: "#211E18",
  surfaceAlt: "#1A1813",
  sheet: "#242019",
  ink: "#F4EFE6",
  inkSoft: "#B6AC9C",
  inkFaint: "#7C7363",
  line: "#332E26",
  accent: "#FF7A5A",
  accentInk: "#1A140F",
  accentSoft: "#3A2519",
  chipBg: "#211E18",
  chipActive: "#F4EFE6",
  chipActiveInk: "#15130F",
  danger: "#FF7A5A",
  backdrop: "rgba(0,0,0,.55)",
};

export const TAG_COLORS: Record<string, string> = {
  Work: "#4F7CFF",
  Personal: "#9B6BFF",
  Health: "#3FB984",
};

export const TAGS = ["Work", "Personal", "Health"] as const;

export const PRIORITIES = {
  high: { label: "High", color: "#FF5A4A" },
  med: { label: "Medium", color: "#F2A33C" },
  low: { label: "Low", color: "#3FB984" },
} as const;
