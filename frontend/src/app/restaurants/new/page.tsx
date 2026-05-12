"use client";

import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { useState } from "react";

export default function RestaurantNewPage() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    phone: "",
    hours: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="식당 등록" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-5 text-sm text-text-secondary">
          지도에 없는 맛집을 직접 등록해보세요!
        </p>

        <div className="flex flex-col gap-4">
          <TextInput
            label="식당명"
            placeholder="식당 이름을 입력하세요"
            value={form.name}
            onChange={set("name")}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {["한식", "양식", "일식", "중식", "카페", "분식", "기타"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    form.category === cat
                      ? "bg-primary text-white"
                      : "border border-border text-text-secondary",
                  ].join(" ")}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <TextInput
            label="주소"
            placeholder="주소를 입력하세요"
            value={form.address}
            onChange={set("address")}
          />
          <TextInput
            label="전화번호"
            placeholder="02-0000-0000"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
          />
          <TextInput
            label="영업시간"
            placeholder="예) 11:00 - 22:00"
            value={form.hours}
            onChange={set("hours")}
          />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg">
          등록하기
        </Button>
      </div>
    </div>
  );
}
