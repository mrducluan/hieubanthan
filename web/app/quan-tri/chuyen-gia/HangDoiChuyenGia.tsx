"use client";
// SAO-CG — một câu hỏi trong hàng đợi: câu + ảnh chụp hồ sơ (nếu có) + nút "Tính số" (engine, qua /api/quan-tri/chuyen-gia viec tinh)
// + ô trả lời có KIỂM TRƯỚC KHI GỬI (lib/chuyen-gia-hoi.kiemTraLoi + luật cố định của engine qua /api/quan-tri/ai viec "kiem") —
// mục CHẶN khoá nút gửi; cảnh báo chỉ nhắc. Chủ sở hữu có nút Hoàn (nhập lý do) sau khi đã chuyển tiền ngoài hệ thống.
import { useState } from "react";
import { AlertTriangle, Calculator, Loader2, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { dinhDangVnd, dongHan, kiemTraLoi, TEN_MANG_CG, TEN_TRANG_THAI, TRA_LOI_TOI_DA, type HoSoCg, type MangCg, type TrangThaiCg } from "@/lib/chuyen-gia-hoi";

export interface CauQT {
  id: number; mang: MangCg; cau_hoi: string; ho_so: HoSoCg | null; gia_vnd: number; mien_phi_hoi_vien: boolean; ma_don: number | null;
  trang_thai: TrangThaiCg; qua_han: boolean; thanh_toan_luc: string | null; han_tra_loi: string | null; tra_loi: string | null;
  tra_loi_luc: string | null; danh_gia: number | null; hoan_luc: string | null; ly_do_hoan: string | null; tao_luc: string; email: string | null;
}
interface BangSo { dong: { ten: string; gia_tri: string }[]; ghi_chu: string | null; tho: unknown }

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));

async function goi(body: Record<string, unknown>): Promise<{ ok: boolean; j: Record<string, unknown> }> {
  const r = await fetch("/api/quan-tri/chuyen-gia", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, j: ((await r.json().catch(() => ({}))) as Record<string, unknown>) };
}

export function HangDoiChuyenGia({ ds, chuSoHuu }: { ds: CauQT[]; chuSoHuu: boolean }) {
  const [daDanhDau, setDaDanhDau] = useState<string | null>(null);
  if (ds.length === 0) return <p className="text-sm text-fg-muted">Không có câu nào ở trạng thái này.</p>;
  return (
    <div className="space-y-4">
      {ds.some((c) => c.qua_han) && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-cinnabar">
          <AlertTriangle className="size-4" aria-hidden /> Có câu đã quá hạn.
          <Button size="sm" variant="outline" onClick={async () => { const { j } = await goi({ viec: "qua_han" }); setDaDanhDau(`Đã đánh dấu ${String(j.so ?? 0)} câu quá hạn — tải lại trang.`); }}>Đánh dấu quá hạn</Button>
          {daDanhDau && <span className="text-fg-muted">{daDanhDau}</span>}
        </p>
      )}
      {ds.map((c) => <MotCau key={c.id} c={c} chuSoHuu={chuSoHuu} />)}
    </div>
  );
}

function MotCau({ c, chuSoHuu }: { c: CauQT; chuSoHuu: boolean }) {
  const [bang, setBang] = useState<BangSo | null>(null);
  const [dangTinh, setDangTinh] = useState(false);
  const [tl, setTl] = useState("");
  const [kiemEngine, setKiemEngine] = useState<string[] | null>(null);
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ loai: "ok" | "loi"; noi: string } | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [moHoan, setMoHoan] = useState(false);
  const kq = kiemTraLoi(tl);
  const choTraLoi = c.trang_thai === "cho_tra_loi" || c.trang_thai === "qua_han";
  const hs = c.ho_so;

  async function tinh() {
    setDangTinh(true);
    const { ok, j } = await goi({ viec: "tinh", id: c.id });
    setBang(ok ? (j as unknown as BangSo) : { dong: [], ghi_chu: String(j.error ?? "Chưa tính được."), tho: null });
    setDangTinh(false);
  }
  async function kiem(): Promise<boolean> {
    // Lớp 2: luật cố định của engine (giọng phán, vùng cấm, liên hệ) — engine lỗi thì chỉ dựa lớp 1 (không chặn oan).
    try {
      const r = await fetch("/api/quan-tri/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ viec: "kiem", muc: [{ moi: tl }] }) });
      if (!r.ok) { setKiemEngine([]); return true; }
      const j = (await r.json()) as { ket_qua?: { ma: string; noi_dung: string }[][] };
      const ds = (j.ket_qua?.[0] ?? []).map((x) => x.noi_dung);
      setKiemEngine(ds);
      return !(j.ket_qua?.[0] ?? []).some((x) => x.ma === "vung_cam" || x.ma === "lien_he");
    } catch { setKiemEngine([]); return true; }
  }
  async function gui() {
    if (kq.chan.length) return;
    setDang(true); setBao(null);
    if (!(await kiem())) { setDang(false); setBao({ loai: "loi", noi: "Engine báo vùng cấm / liên hệ — sửa rồi gửi lại." }); return; }
    const { ok, j } = await goi({ viec: "tra_loi", id: c.id, tra_loi: tl.trim() });
    setDang(false);
    if (!ok) { setBao({ loai: "loi", noi: String(j.error ?? "Chưa gửi được.") }); return; }
    ghi("expert_answered", { mang: c.mang });
    setBao({ loai: "ok", noi: "Đã gửi câu trả lời — tải lại trang để thấy trạng thái mới." });
  }
  async function hoan() {
    setDang(true); setBao(null);
    const { ok, j } = await goi({ viec: "hoan", id: c.id, ly_do: lyDo.trim() });
    setDang(false);
    setBao(ok ? { loai: "ok", noi: `Đã đánh dấu hoàn ${dinhDangVnd(Number(j.gia_vnd ?? c.gia_vnd))} — tải lại trang.` } : { loai: "loi", noi: String(j.error ?? "Chưa hoàn được.") });
  }

  return (
    <Card data-testid="qt-cg-cau" data-id={c.id} className={`space-y-3 ${c.qua_han || c.trang_thai === "qua_han" ? "border border-cinnabar/40" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-fg-muted">#{c.id} · {TEN_MANG_CG[c.mang]} · {c.mien_phi_hoi_vien ? "lượt hội viên" : dinhDangVnd(c.gia_vnd)}{c.ma_don ? ` · đơn ${c.ma_don}` : ""}{c.email ? ` · ${c.email}` : ""}</span>
        <span className={c.qua_han || c.trang_thai === "qua_han" ? "text-cinnabar" : "text-gold"}>{c.qua_han ? "Quá hạn" : TEN_TRANG_THAI[c.trang_thai]}{c.han_tra_loi && choTraLoi ? ` · ${dongHan(c.han_tra_loi)}` : ""}</span>
      </div>
      <p className="whitespace-pre-wrap text-fg">{c.cau_hoi}</p>
      <div className="rounded-xl border border-line/60 p-3 text-sm">
        {hs ? (
          <p data-testid="qt-cg-ho-so">Hồ sơ (người hỏi đồng ý): <b>{hs.ho_ten}</b> · {hs.ngay_sinh.split("-").reverse().join("/")}
            {hs.gio_sinh ? ` · ${hs.gio_sinh}${hs.do_tin_gio === "approx" ? " (ước chừng)" : ""}` : hs.do_tin_gio === "unknown" ? " · không rõ giờ" : " · không có giờ"}
            {hs.gioi_tinh ? ` · ${hs.gioi_tinh === "nam" ? "nam" : "nữ"}` : " · không có giới tính"}{hs.noi_sinh ? ` · ${hs.noi_sinh}` : ""}</p>
        ) : <p className="text-fg-muted">Người hỏi không chia sẻ hồ sơ (hoặc đã quá 30 ngày) — trả lời theo câu chữ.</p>}
        {hs && c.mang !== "kinh_dich" && !bang && (
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => void tinh()} disabled={dangTinh} data-testid="qt-cg-tinh">
            {dangTinh ? <Loader2 className="animate-spin" aria-hidden /> : <Calculator aria-hidden />} Tính số (engine)
          </Button>
        )}
        {bang && (
          <div className="mt-2 space-y-1" data-testid="qt-cg-bang">
            {bang.dong.map((d) => <p key={d.ten}><span className="text-fg-muted">{d.ten}:</span> {d.gia_tri}</p>)}
            {bang.ghi_chu && <p className="text-xs text-gold">{bang.ghi_chu}</p>}
            {bang.tho != null && <details className="text-xs text-fg-faint"><summary>Dữ liệu thô</summary><pre className="overflow-x-auto">{JSON.stringify(bang.tho, null, 1)}</pre></details>}
          </div>
        )}
      </div>
      {c.tra_loi && (
        <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-3 text-sm">
          <p className="text-xs text-gold">Đã trả lời{c.tra_loi_luc ? ` · ${ngayGio(c.tra_loi_luc)}` : ""}{c.danh_gia ? ` · người hỏi chấm ${c.danh_gia}/5` : ""}</p>
          <p className="mt-1 whitespace-pre-wrap">{c.tra_loi}</p>
        </div>
      )}
      {c.trang_thai === "hoan" && <p className="text-sm text-fg-muted">Đã hoàn{c.hoan_luc ? ` ${ngayGio(c.hoan_luc)}` : ""}{c.ly_do_hoan ? ` — ${c.ly_do_hoan}` : ""}</p>}
      {choTraLoi && (
        <div className="space-y-2">
          <Textarea rows={8} maxLength={TRA_LOI_TOI_DA} value={tl} onChange={(e) => { setTl(e.target.value); setKiemEngine(null); }} aria-label="Câu trả lời" data-testid="qt-cg-tra-loi"
            placeholder="Viết cho người này. Mở bằng điều họ hỏi, nêu căn cứ ngắn (sao / số / quẻ) rồi điều nên làm và điều nên tránh. Không hứa, không doạ." />
          <p className="text-xs text-fg-faint">{tl.trim().length.toLocaleString("vi-VN")}/{TRA_LOI_TOI_DA.toLocaleString("vi-VN")} ký tự</p>
          {kq.chan.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-cinnabar" data-testid="qt-cg-chan">{kq.chan.map((x) => <li key={x}>{x}</li>)}</ul>
          )}
          {kq.canh_bao.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-gold" data-testid="qt-cg-canh-bao">{kq.canh_bao.map((x) => <li key={x}>{x}</li>)}</ul>
          )}
          {kiemEngine && kiemEngine.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-gold">{kiemEngine.map((x) => <li key={x}>Engine: {x}</li>)}</ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void gui()} disabled={dang || kq.chan.length > 0 || tl.trim().length < 20} data-testid="qt-cg-gui">
              {dang ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Trả lời
            </Button>
            {chuSoHuu && c.gia_vnd > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setMoHoan((v) => !v)} data-testid="qt-cg-mo-hoan"><Undo2 aria-hidden /> Hoàn tiền</Button>
            )}
          </div>
        </div>
      )}
      {chuSoHuu && c.gia_vnd > 0 && moHoan && (
        <div className="flex flex-col gap-2 rounded-xl border border-line/60 p-3 text-sm sm:flex-row sm:items-center">
          <span className="text-fg-muted">Đã chuyển trả {dinhDangVnd(c.gia_vnd)} ngoài hệ thống? Ghi lý do rồi bấm.</span>
          <Input value={lyDo} onChange={(e) => setLyDo(e.target.value)} maxLength={120} placeholder="Lý do (5–120 ký tự)" aria-label="Lý do hoàn" className="h-10 sm:max-w-xs" />
          <Button size="sm" variant="outline" onClick={() => void hoan()} disabled={dang || lyDo.trim().length < 5} data-testid="qt-cg-hoan">Đánh dấu đã hoàn</Button>
        </div>
      )}
      {chuSoHuu && c.gia_vnd > 0 && c.trang_thai === "da_tra_loi" && !moHoan && (
        <button type="button" className="text-xs text-fg-faint hover:text-gold" onClick={() => setMoHoan(true)}>Hoàn tiền câu này…</button>
      )}
      {bao && <p role="status" className={`text-sm ${bao.loai === "ok" ? "text-jade" : "text-cinnabar"}`}>{bao.noi}</p>}
    </Card>
  );
}
