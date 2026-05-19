// 친구 핀 색상 enum (백엔드) ↔ HEX (프론트) 매핑.

export type PinColorName = "pink" | "blue" | "green" | "purple" | "coral";

export const PIN_COLOR_HEX: Record<PinColorName, string> = {
  pink: "#F472B6",
  blue: "#60A5FA",
  green: "#34D399",
  purple: "#A78BFA",
  coral: "#FB7185",
};

export function hexFromColorName(name: PinColorName | string | null | undefined): string {
  if (!name) return PIN_COLOR_HEX.pink;
  return PIN_COLOR_HEX[name as PinColorName] ?? PIN_COLOR_HEX.pink;
}
