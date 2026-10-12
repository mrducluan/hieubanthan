"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/trinh-duyet";

export function CongGia() {
  const ma = Number(useSearchParams().get("ma"));
  const router = useRouter();
  const [loi, setLoi] = useState<string | null>(null);
  async function tra(huy: boolean) {
    if (huy) { router.push(`/nap-sao/ket-qua?ma=${ma}&huy=1`); return; }
    const token = (await (await supabase())?.auth.getSession())?.data.session?.access_token;
    const r = await fetch("/api/thanh-toan/gia", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token ?? ""}` },
      body: JSON.stringify({ ma_don: ma }),
    });
    if (!r.ok) { setLoi("Không giả lập được."); return; }
    router.push(`/nap-sao/ket-qua?ma=${ma}`);
  }
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p>Đơn <b>{ma}</b></p>
      <div className="flex gap-3">
        <Button onClick={() => void tra(false)}>Giả lập đã trả</Button>
        <Button variant="secondary" onClick={() => void tra(true)}>Huỷ</Button>
      </div>
      {loi && <p role="alert" className="text-sm text-red-300">{loi}</p>}
    </div>
  );
}
