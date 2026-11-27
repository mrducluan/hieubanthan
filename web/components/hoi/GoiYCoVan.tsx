"use client";
// CV-4 — dưới câu trả lời MỚI NHẤT của khung hỏi đáp: nếu câu vừa hỏi là một QUYẾT ĐỊNH (mở shop, mua nhà, nghỉ việc, góp vốn…)
// thì mời sang Cố vấn xem ba cách nhìn + tháng nào hợp. Engine nhận diện (web không tự đoán); câu khủng hoảng / về người khác /
// chuyện đã xảy ra không bao giờ có gợi ý. Chữ câu hỏi đi qua sessionStorage sang /co-van, không lên URL.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Target } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { datCauChoCoVan } from "@/lib/cau-hoi-co-van";

const MO_DUN_CO_GOI_Y = new Set(["tuvi", "battu", "phongthuy", "thanso"]);
interface NhanDien { nhan_ra: boolean; viec: { ma: string; ten: string } | null; kieu: string | null }

export function GoiYCoVan({ cau, moDun }: { cau: string; moDun: string }) {
  const router = useRouter();
  const [nd, setNd] = useState<NhanDien | null>(null);
  useEffect(() => {
    setNd(null);
    if (!MO_DUN_CO_GOI_Y.has(moDun) || cau.trim().length < 3) return;
    const huy = new AbortController();
    fetch("/api/co-van/nhan-dien", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cau_hoi: cau }), signal: huy.signal })
      .then((r) => (r.ok ? (r.json() as Promise<NhanDien>) : null))
      .then((d) => { if (d?.nhan_ra && (d.kieu === "co_nen" || d.kieu === "khi_nao")) { setNd(d); ghi("cross_cta_viewed", { tu: `hoi_dap_${moDun}`, ca_nhan: 0 }); } })
      .catch(() => { /* gợi ý là phần thêm — lỗi thì thôi */ });
    return () => huy.abort();
  }, [cau, moDun]);
  if (!nd?.viec) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gold/35 bg-gold/[0.06] px-4 py-3 text-sm" data-testid="goi-y-co-van">
      <Target className="size-4 shrink-0 text-gold" aria-hidden />
      <span className="min-w-0 flex-1 text-fg-muted">Đây là một quyết định ({nd.viec.ten}). Cố vấn xem thêm tháng nào hợp, cần chuẩn bị gì và hướng cửa.</span>
      <button type="button" data-testid="goi-y-co-van-nut"
        onClick={() => { ghi("cross_cta_clicked", { tu: `hoi_dap_${moDun}`, den: "co_van", ca_nhan: 0 }); datCauChoCoVan(cau); router.push("/co-van"); }}
        className="inline-flex min-h-10 items-center gap-1 rounded-full bg-gold px-4 text-xs font-semibold text-bg hover:opacity-95">
        Xem ba cách nhìn <ArrowRight className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
