import BottomNav from "@/components/layout/BottomNav";
import type { ReactNode } from "react";

type TabsLayoutProps = {
  children: ReactNode;
};

export default function TabsLayout({ children }: TabsLayoutProps) {
  return (
    <>
      <div className="h-full pb-[56px]">{children}</div>
      <BottomNav />
    </>
  );
}
