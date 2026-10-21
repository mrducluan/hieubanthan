"use client";
// LG-ĐS mục 3 — "Lưu vào tài khoản" cho bài luận đời sống: chỉ người đã đăng nhập, chỉ khi người dùng bấm (hoặc tự bật
// "Tự lưu các bài luận sau" — KHÔNG tích sẵn). Máy chủ (bảng luan_giai_luu, RLS chủ sở hữu, 12 tháng) chưa bật →
// `{ok:false, ly_do:'chua_bat'}` → ẩn cả khối. Không lưu trên trình duyệt.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { useNguoiDung } from "@/lib/tai-khoan";

type TuyChon = { tu_luu_luan_giai: boolean };

async function docJson(r: Response): Promise<Record<string, unknown> | null> {
  try { return (await r.json()) as Record<string, unknown>; } catch { return null; }
}

export function LuuBaiLuan({ moDun, tieuDe, noiDung, dangNhap }: {
  moDun: string; tieuDe: string; /** báo cáo đầy đủ để lưu */ noiDung: unknown;
  /** máy chủ đã báo người xem đang đăng nhập (vd `phi.dang_nhap` của báo cáo) */ dangNhap?: boolean;
}) {
  const nguoi = useNguoiDung();
  const [tuyChon, setTuyChon] = useState<TuyChon | null>(null);
  const [chuaBat, setChuaBat] = useState(false);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    let huy = false;
    fetch("/api/luan-giai/tuy-chon").then(async (r) => {
      const d = await docJson(r);
      if (huy) return;
      if (d?.ok === false && d.ly_do === "chua_bat") { setChuaBat(true); return; }
      if (r.ok && d && typeof d.tu_luu_luan_giai === "boolean") setTuyChon({ tu_luu_luan_giai: d.tu_luu_luan_giai });
    }).catch(() => { /* coi như chưa có tuỳ chọn */ });
    return () => { huy = true; };
  }, []);

  const luu = async (tuDong = false) => {
    if (dang) return;
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/luan-giai/luu", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mo_dun: moDun, tieu_de: tieuDe, noi_dung: noiDung }),
      });
      const d = await docJson(r);
      if (d?.ok === false && d.ly_do === "chua_bat") { setChuaBat(true); return; }
      if (r.ok && d && (typeof d.id === "string" || typeof d.id === "number")) {
        setDaLuu(String(d.id));
        ghi("chart_interacted", { mo_dun: moDun, kind: tuDong ? "luu_luan_giai_tu_dong" : "luu_luan_giai" });
      } else if (!tuDong) setLoi(typeof d?.error === "string" ? d.error : "Chưa lưu được, bạn thử lại sau.");
    } catch { if (!tuDong) setLoi("Chưa lưu được, bạn thử lại sau."); }
    finally { setDang(false); }
  };

  // Đã bật "tự lưu" → lưu một lần cho mỗi báo cáo đầy đủ vừa tải.
  const daTuLuu = useRef<unknown>(null);
  useEffect(() => {
    if (tuyChon?.tu_luu_luan_giai && !chuaBat && daTuLuu.current !== noiDung) {
      daTuLuu.current = noiDung;
      void luu(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- theo báo cáo + tuỳ chọn
  }, [tuyChon?.tu_luu_luan_giai, noiDung, chuaBat]);

  const doiTuLuu = async (v: boolean) => {
    setTuyChon({ tu_luu_luan_giai: v });
    try {
      const r = await fetch("/api/luan-giai/tuy-chon", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tu_luu_luan_giai: v }),
      });
      const d = await docJson(r);
      if (d?.ok === false && d.ly_do === "chua_bat") setChuaBat(true);
      else if (!r.ok) { setTuyChon({ tu_luu_luan_giai: !v }); setLoi("Chưa đổi được tuỳ chọn, bạn thử lại sau."); }
    } catch { setTuyChon({ tu_luu_luan_giai: !v }); }
  };

  const coDangNhap = Boolean(nguoi) || dangNhap === true || tuyChon !== null;
  if (chuaBat || !coDangNhap) return null;
  return (
    <div className="w-full rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 text-sm print:hidden" data-testid="luu-bai-luan">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {daLuu ? (
          <p role="status" className="inline-flex items-center gap-1.5 text-jade" data-testid="da-luu">
            <BookmarkCheck className="size-4" aria-hidden /> Đã lưu ·{" "}
            <Link href={`/ban-than/bai-da-luu?id=${encodeURIComponent(daLuu)}`} className="text-gold underline">Xem bài đã lưu</Link>
          </p>
        ) : (
          <Button size="sm" variant="outline" onClick={() => void luu()} disabled={dang}>
            <BookmarkPlus aria-hidden /> {dang ? "Đang lưu…" : "Lưu vào tài khoản"}
          </Button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 text-fg-muted">
          <input type="checkbox" className="size-4 accent-[rgb(var(--gold))]" checked={tuyChon?.tu_luu_luan_giai ?? false}
            onChange={(e) => void doiTuLuu(e.target.checked)} />
          Tự lưu các bài luận sau
        </label>
      </div>
      <p className="mt-1.5 text-xs text-fg-faint">Bài lưu 12 tháng, chỉ bạn xem được, xoá được bất cứ lúc nào.</p>
      {loi && <p role="alert" className="mt-1 text-xs text-fg">{loi}</p>}
    </div>
  );
}
