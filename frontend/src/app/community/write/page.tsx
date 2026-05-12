import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";

type WriteTypeCardProps = {
  href: string;
  emoji: string;
  title: string;
  description: string;
};

function WriteTypeCard({ href, emoji, title, description }: WriteTypeCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border-2 border-border bg-white p-5 active:border-primary active:bg-primary/5"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
        {emoji}
      </div>
      <div>
        <p className="text-base font-bold text-text-primary">{title}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
      </div>
    </Link>
  );
}

export default function WriteSelectPage() {
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="글 작성" leftAction="close" />

      <div className="flex flex-col gap-4 px-4 py-8">
        <p className="mb-2 text-base font-semibold text-text-primary">
          어떤 글을 작성하시겠어요?
        </p>
        <WriteTypeCard
          href="/community/write/simple"
          emoji="⭐"
          title="간단 리뷰"
          description="별점과 짧은 한 줄 평가를 남겨보세요"
        />
        <WriteTypeCard
          href="/community/write/blog"
          emoji="📝"
          title="맛집 블로그"
          description="사진과 함께 자세한 후기를 작성해보세요"
        />
      </div>
    </div>
  );
}
