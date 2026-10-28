"use client";
// LG-ĐS — danh sách + xem + xoá bài luận đã lưu (máy chủ: /api/luan-giai/luu, RLS chủ sở hữu). Bài mở ra hiện bằng
// CÙNG component với lúc vừa đọc (components/luan-giai/BaoCaoDoiSong) — không gọi lại engine.
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpenText, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KhungTai } from "@/components/khung/TieuDe";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { laBaoCaoDoiSong } from "@/components/luan-giai/kieu";
import { TrucQuan, type KhoiTrucQuan } from "@/components/hoi/TrucQuan";
import { ViSao } from "@/components/luan-giai/HopNoiBat";

/** HD-CS đợt 3 (ý 6) — câu trả lời hỏi đáp người dùng bấm "Lưu" (CauTraLoi). */
type HoiDap = { loai: "hoi_dap"; cau_hoi: string; cau_tra_loi: string; truc_quan?: KhoiTrucQuan[]; can_cu?: string[]; ghi_chu?: string };
const laHoiDap = (x: unknown): x is HoiDap => (x as { loai?: unknown } | null)?.loai === "hoi_dap" && typeof (x as HoiDap).cau_tra_loi === "string";

function HoiDapDaLuu({ nd }: { nd: HoiDap }) {
  return (
    <article className="glass space-y-5 rounded-2xl p-5 sm:p-8" data-testid="hoi-dap-da-luu">
      {nd.cau_hoi && (<div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-gold/90">Bạn hỏi</p>
        <h2 className="mt-1 font-serif text-2xl leading-snug">{nd.cau_hoi}</h2>
      </div>)}
      <TrucQuan ds={nd.truc_quan} tinh />
      <div className="prose-vn space-y-3 text-[1.05rem] leading-[1.75]">{nd.cau_tra_loi.split("\n\n").map((d, i) => <p key={i} className="whitespace-pre-line">{d}</p>)}</div>
      <ViSao canCu={nd.can_cu} />
      {nd.ghi_chu && <p className="text-xs text-fg-faint">{nd.ghi_chu}</p>}
    </article>
  );
}

interface DongBai { id: string; mo_dun: string; tieu_de: string; tao_luc: string }
type TrangThai = { kieu: "tai" } | { kieu: "can_dang_nhap" } | { kieu: "chua_bat" } | { kieu: "loi" } | { kieu: "xong"; ds: DongBai[] };

const TEN_MO_DUN: Record<string, string> = { tuvi: "Tử vi", battu: "Bát tự", thanso: "Thần số", phongthuy: "Phong thuỷ", kinhdich: "Kinh Dịch" };
const ngay = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export function BaiDaLuu() {
  const tim = useSearchParams();
  const router = useRouter();
  const idMo = tim.get("id");
  const [tt, setTt] = useState<TrangThai>({ kieu: "tai" });
  const [bai, setBai] = useState<{ id: string; noi_dung: unknown } | null>(null);
  const [dangMo, setDangMo] = useState(false);
  const [loiBai, setLoiBai] = useState<string | null>(null);
  const [xoa, setXoa] = useState<string | null>(null);

  const taiDs = useCallback(async () => {
    try {
      const r = await fetch("/api/luan-giai/luu");
      const d = (await r.json().catch(() => null)) as { ds?: DongBai[]; ok?: boolean; ly_do?: string } | null;
      if (d?.ok === false && d.ly_do === "chua_bat") return setTt({ kieu: "chua_bat" });
      if (r.status === 401 || d?.ok === false) return setTt({ kieu: "can_dang_nhap" });
      if (!r.ok || !Array.isArray(d?.ds)) return setTt({ kieu: "loi" });
      setTt({ kieu: "xong", ds: d.ds.map((b) => ({ ...b, id: String(b.id) })) });
    } catch { setTt({ kieu: "loi" }); }
  }, []);
  useEffect(() => { void taiDs(); }, [taiDs]);

  useEffect(() => {
    if (!idMo) { setBai(null); return; }
    let huy = false;
    setDangMo(true); setLoiBai(null);
    fetch(`/api/luan-giai/luu/${encodeURIComponent(idMo)}`)
      .then(async (r) => {
        const d = (await r.json().catch(() => null)) as { noi_dung?: unknown } | null;
        if (huy) return;
        if (!r.ok || !d?.noi_dung) { setLoiBai("Không mở được bài này — có thể bài đã hết hạn hoặc đã xoá."); setBai(null); return; }
        setBai({ id: idMo, noi_dung: d.noi_dung });
      })
      .catch(() => { if (!huy) setLoiBai("Không mở được bài này, bạn thử lại sau."); })
      .finally(() => { if (!huy) setDangMo(false); });
    return () => { huy = true; };
  }, [idMo]);

  const moBai = (id: string | null) => router.push(id ? `/ban-than/bai-da-luu?id=${encodeURIComponent(id)}` : "/ban-than/bai-da-luu", { scroll: true });

  const xoaBai = async (id: string) => {
    setXoa(id);
    try {
      const r = await fetch(`/api/luan-giai/luu/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (r.ok) {
        setTt((t) => (t.kieu === "xong" ? { kieu: "xong", ds: t.ds.filter((b) => b.id !== id) } : t));
        if (idMo === id) moBai(null);
      }
    } finally { setXoa(null); }
  };

  if (idMo) {
    const dong = tt.kieu === "xong" ? tt.ds.find((b) => b.id === idMo) : undefined;
    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => moBai(null)}><ArrowLeft aria-hidden /> Danh sách bài</Button>
          {bai && <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>}
          {bai && (
            <Button variant="ghost" size="sm" onClick={() => void xoaBai(bai.id)} disabled={xoa === bai.id} data-testid="xoa-bai-dang-xem">
              <Trash2 aria-hidden /> Xoá bài này
            </Button>
          )}
        </div>
        {dangMo && <KhungTai dong={4} />}
        {loiBai && <p role="alert" className="text-sm text-fg-muted">{loiBai}</p>}
        {bai && (laBaoCaoDoiSong(bai.noi_dung)
          ? <BaoCaoDoiSongView bc={bai.noi_dung} ten={dong?.tieu_de.replace(/^Luận giải\s*/i, "") ?? "đã lưu"} />
          : laHoiDap(bai.noi_dung) ? <HoiDapDaLuu nd={bai.noi_dung} /> : <BaiCu noiDung={bai.noi_dung} />)}
      </div>
    );
  }

  if (tt.kieu === "tai") return <div className="mt-6"><KhungTai dong={3} /></div>;
  if (tt.kieu === "can_dang_nhap") {
    return (
      <p className="mt-6 text-fg-muted" data-testid="bai-luu-dang-nhap">
        Đăng nhập để xem bài đã lưu.{" "}
        <Link href="/dang-nhap?tiep=%2Fban-than%2Fbai-da-luu" className="text-gold underline">Đăng nhập</Link>
      </p>
    );
  }
  if (tt.kieu === "chua_bat") return <p className="mt-6 text-fg-muted">Tính năng lưu bài chưa mở trên hệ thống.</p>;
  if (tt.kieu === "loi") return <p role="alert" className="mt-6 text-fg-muted">Chưa tải được danh sách, bạn thử lại sau.</p>;
  if (!tt.ds.length) {
    return (
      <p className="mt-6 text-fg-muted" data-testid="bai-luu-trong">
        Bạn chưa lưu bài nào. Mở <Link href="/tu-vi" className="text-gold underline">Tử vi</Link>, đọc phần Luận giải toàn bộ rồi bấm
        “Lưu vào tài khoản”.
      </p>
    );
  }
  return (
    <ul className="mt-6 space-y-2" data-testid="ds-bai-luu">
      {tt.ds.map((b) => (
        <li key={b.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3" data-testid="bai-luu">
          <BookOpenText className="size-5 shrink-0 text-gold" aria-hidden />
          <button type="button" onClick={() => moBai(b.id)} className="min-w-0 flex-1 text-left">
            <span className="block font-medium text-fg hover:text-gold">{b.tieu_de}</span>
            <span className="text-xs text-fg-faint">{TEN_MO_DUN[b.mo_dun] ?? b.mo_dun} · lưu ngày {ngay(b.tao_luc)}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => void xoaBai(b.id)} disabled={xoa === b.id} aria-label={`Xoá bài ${b.tieu_de}`}>
            <Trash2 aria-hidden /> Xoá
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Bài lưu không phải báo cáo đời sống (bản cũ / mảng khác): hiện tiêu đề chương + đoạn văn. */
function BaiCu({ noiDung }: { noiDung: unknown }) {
  const ds = (noiDung as { chuong?: { ma: string; tieu_de: string; doan?: string[] }[] })?.chuong ?? [];
  return (
    <article className="glass space-y-6 rounded-2xl p-5 sm:p-8">
      {ds.map((c) => (
        <section key={c.ma}>
          <h2 className="font-serif text-2xl">{c.tieu_de}</h2>
          <div className="mt-2 space-y-2 text-fg-muted">{(c.doan ?? []).map((d, i) => <p key={i}>{d}</p>)}</div>
        </section>
      ))}
    </article>
  );
}
