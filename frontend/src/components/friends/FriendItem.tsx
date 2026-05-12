import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import type { Friend } from "@/lib/mockData";

type FriendItemProps = {
  friend: Friend;
  variant?: "friend" | "request" | "search";
  onAccept?: () => void;
  onReject?: () => void;
  onAdd?: () => void;
};

export default function FriendItem({
  friend,
  variant = "friend",
  onAccept,
  onReject,
  onAdd,
}: FriendItemProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar src={friend.avatar} name={friend.name} size="md" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-text-primary">{friend.name}</p>
        <p className="text-xs text-text-secondary">{friend.username}</p>
      </div>

      {variant === "request" && (
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={onReject}>거절</Button>
          <Button size="sm" onClick={onAccept}>수락</Button>
        </div>
      )}
      {variant === "search" && (
        <Button size="sm" onClick={onAdd}>친구 추가</Button>
      )}
    </div>
  );
}
