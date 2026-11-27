"use client";
// Chặng 3.3A — "Các trường phái khác đọc ngày sinh của bạn thế nào?" — khối PHỤ, gập sẵn, đặt SAU bài đọc chính (bài đọc
// chính và khung "Cách xem" vẫn là Pitago / Phillips — TS-PHAI-3, chủ dự án 2026-11-27). Chỉ tải khi người dùng mở.
// Tên trường phái chỉ là nhãn cột; tên sách + câu trích nằm trong "Vì sao nói vậy". Cha truyền `key` theo ngày sinh / họ tên /
// cách tính để đổi hồ sơ là xoá kết quả cũ.
import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "@/components/khung/Lien";
import { useDuong } from "@/components/khung/NgonNgu";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { fetchNN, useChuThanSo } from "@/components/than-so/chu-than-so";
import { ghi } from "@/lib/do-luong";
import { loiTheoNgonNgu } from "@/lib/loi-ngon-ngu";

interface PhaiItem {
  ma: string;
  ten_phai: string;
  chi_so_chinh: string;
  nhan_xet: string;
  trich_nguon?: { sach: string; nguyen_van_en: string } | null;
}

interface KetQuaDaPhai {
  khung?: { tieu_de?: string; phu_de?: string; cau_noi_dong_phuong?: string };
  nam_phai: PhaiItem[];
  lien_ket_mo_rong?: { ten: string; duong: string }[];
}

export function DoiChieuDaPhaiThanSo({
  ngaySinhIso,
  hoTen,
  quyUoc = "tong_het",
}: {
  ngaySinhIso: string;
  hoTen: string;
  quyUoc?: "tong_het" | "tung_phan";
}) {
  const { c: t, en } = useChuThanSo();
  const d = useDuong();
  const [dangTai, setDangTai] = useState(false);
  const [kq, setKq] = useState<KetQuaDaPhai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  async function taiDaPhai() {
    if (dangTai || kq) return;
    setDangTai(true);
    setLoi(null);
    try {
      const res = await fetchNN("/api/thanso/doi-chieu-phai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ngay_sinh: ngaySinhIso, ho_ten: hoTen, quy_uoc_duong_doi: quyUoc }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(body?.nam_phai)) {
        setLoi(loiTheoNgonNgu(body?.error, en, t("dp.loi")));
        return;
      }
      setKq(body as KetQuaDaPhai);
    } catch {
      setLoi(t("dp.loi_mang"));
    } finally {
      setDangTai(false);
    }
  }

  return (
    <details
      className="group my-8 rounded-2xl border border-line/80 bg-surface/35"
      data-testid="doi-chieu-da-phai-thanso"
      onToggle={(e) => {
        if (!(e.currentTarget as HTMLDetailsElement).open) return;
        if (!kq) ghi("chart_interacted", { mo_dun: "thanso", kind: "da_phai_mo" });
        void taiDaPhai();
      }}
    >
      <summary data-testid="nut-mo-5-phai-thanso"
        className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-base font-semibold text-fg [&::-webkit-details-marker]:hidden">
        <span>{t("dp.tieu_de")}</span>
        <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-4 px-5 pb-5">
        <p className="text-sm leading-relaxed text-fg-muted">{t("dp.dan")}</p>
        {dangTai && <p className="text-sm text-fg-muted">{t("dp.dang")}</p>}
        {loi && (
          <p role="alert" className="text-sm text-amber-300">
            {loi}{" "}
            <button type="button" onClick={() => void taiDaPhai()} className="min-h-11 font-medium text-gold underline">{t("dp.thu_lai")}</button>
          </p>
        )}

        {kq && (
          <div className="space-y-4" data-testid="ket-qua-5-phai-thanso">
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {kq.nam_phai.map((p) => (
                <div key={p.ma} className="min-w-0 rounded-xl border border-line/70 bg-bg/55 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gold">{p.ten_phai}</span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-fg">{p.chi_so_chinh}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.nhan_xet}</p>
                  {p.trich_nguon && <ViSao nho canCu={[`${p.trich_nguon.sach}: “${p.trich_nguon.nguyen_van_en}”`]} />}
                </div>
              ))}
            </div>

            {(kq.khung?.cau_noi_dong_phuong || kq.lien_ket_mo_rong?.length) ? (
              <div className="rounded-xl border border-jade/35 bg-jade/5 p-4 text-sm">
                {kq.khung?.cau_noi_dong_phuong && <p className="leading-relaxed text-fg-muted">{kq.khung.cau_noi_dong_phuong}</p>}
                <div className="mt-1 flex flex-wrap gap-x-4">
                  {kq.lien_ket_mo_rong?.map((lk) => (
                    <Link key={lk.duong} href={d(lk.duong)} className="inline-flex min-h-11 items-center gap-1 font-medium text-jade hover:underline">
                      {lk.ten} <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </details>
  );
}
