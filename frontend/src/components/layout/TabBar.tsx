"use client";

type Tab = {
  key: string;
  label: string;
};

type TabBarProps = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function TabBar({ tabs, activeKey, onChange, className = "" }: TabBarProps) {
  return (
    <div className={["flex border-b border-border bg-white", className].join(" ")}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              "flex-1 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
