// ISO 8601 timestamp → "방금 전" / "3시간 전" / "어제" / "5/12" 형태로 변환.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));

  if (diffSec < MINUTE) return "방금 전";
  if (diffSec < HOUR) return `${Math.floor(diffSec / MINUTE)}분 전`;
  if (diffSec < DAY) return `${Math.floor(diffSec / HOUR)}시간 전`;
  if (diffSec < 2 * DAY) return "어제";
  if (diffSec < WEEK) return `${Math.floor(diffSec / DAY)}일 전`;

  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatPrice(won: number): string {
  return `${won.toLocaleString("ko-KR")}원`;
}
