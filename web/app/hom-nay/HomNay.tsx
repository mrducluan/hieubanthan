"use client";
// HN-1 — thẻ "Hôm nay của bạn". Engine tính mọi con số (web chỉ hiển thị). Chuỗi ngày ghé đếm trên máy người dùng
// (localStorage, không gửi đi) — mất chuỗi không bị phạt gì, chỉ bắt đầu lại. Chia sẻ không kèm ngày sinh.
// HN-2: "Hôm nay bạn định làm gì?" — chọn ý định hoặc gõ một câu; engine nhận diện ý định bằng luật từ khoá, không lưu
// câu, không trả lại câu. Trên máy chỉ nhớ MÃ ý định của đúng ngày đó (mở lại trong ngày vẫn thấy).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Briefcase, CalendarDays, Coffee, Dumbbell, Flame, Globe2, Handshake, Heart, Home, LifeBuoy, MessageCircleQuestion,
  MoonStar, Palette, Plane, Rocket, Share2, Sparkles, Sunrise, Wallet, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";

interface NgayCN { so: number; nghia: string; tu_soi: string }
interface TheHomNay {
  ngay_xem: string;
  am_lich: { ngay: number; thang: number; nam: number; nhuan: boolean; can_chi_ngay: string; can_chi_thang: string; can_chi_nam: string };
  ngay_ca_nhan: NgayCN;
  thang_ca_nhan: { so: number; thang: number; chu_de: string | null; nen: string | null; tranh: string | null };
  nam_ca_nhan: { so: number; nam: number; chu_de: string | null; nen: string | null; tranh: string | null };
  ngay_mai: NgayCN & { ngay: string };
  luu_y: string;
  // HN-2
  y_dinh_hom_nay: YDinhKq[];
  y_dinh_nhan_dien: string[];
  ho_tro: string | null;
  danh_sach_y_dinh: Record<string, { ten: string; bieu_tuong: string; cau_hoi: string }>;
  cau_hoi_noi_bat: string[];
  ngay_pho_quat: { so: number; nghia: string | null };
  chaldea: {
    so: number; kep: number | null; so_ngay_sinh: number; cong_huong: boolean;
    nghia_goc: { ten: string; hanh_tinh: string } | null; nghia_kep: { bieu_tuong: string; xu_huong: string } | null;
  };
  hoang_lich?: HoangLichHomNay;
  que_ngay?: QueNgay;
  nhip_bat_tu?: { nhat_chu: string; can_chi_ngay: string; thap_than: string; nhom: string | null; y_nghia: string | null;
    tinh_cach: string | null; cau_tu_soi: string | null; cach_tinh: string };
}
interface HoangLichHomNay {
  truc: string; truc_y: string; than: string; hoang_dao: boolean;
  gio_hoang_dao: { chi: string; khung: string; than: string }[];
  xung_tuoi: string; tuoi: { can_chi: string; quan_he: { ma: string | null; ten: string; nghia: string } } | null;
  nghi: string[]; ky: string[]; ky_dan_gian: string[];
  ngay_tot_gan: { ngay: string; con_ngay?: number; than: string; truc: string } | null;
  viec: { ma_viec: string; ten: string; danh_gia: "tot" | "binh" | "tranh"; ly_do: string[];
    ngay_tot_gan: { ngay: string; con_ngay?: number } | null }[];
}
interface QueNgay {
  so: number; ten: string; thuong: string; ha: string; hao_dong: number; bien: { so: number; ten: string } | null;
  y_chinh: string | null; loi_khuyen: string | null; cau_tu_soi: string | null; duong: string | null; cach_khoi: string;
}
const DANH_GIA_VIEC: Record<HoangLichHomNay["viec"][number]["danh_gia"], { chu: string; lop: string }> = {
  tot: { chu: "Sách lịch ghi nên", lop: "text-jade" },
  binh: { chu: "Sách lịch không ghi riêng", lop: "text-fg-muted" },
  tranh: { chu: "Sách lịch khuyên chọn ngày khác", lop: "text-moon" },
};
const dmy = (iso: string) => iso.split("-").reverse().join("/");

interface YDinhKq { ma: string; ten: string; bieu_tuong: string; nhip: "thuan" | "trung_tinh" | "can_nhac"; nhan: string; cach_lam: string; tu_soi: string }

const ICON: Record<string, LucideIcon> = { Briefcase, Handshake, BookOpen, Heart, Home, Wallet, Dumbbell, Rocket, Plane, Coffee, Palette };
const NHIP: Record<YDinhKq["nhip"], { chu: string; lop: string }> = {
  thuan: { chu: "Thuận nhịp hôm nay", lop: "border-jade/40 bg-jade/[0.06] text-jade" },
  trung_tinh: { chu: "Bình thường", lop: "border-gold/40 bg-gold/[0.06] text-gold" },
  can_nhac: { chu: "Nên làm theo cách khác", lop: "border-moon/40 bg-moon/[0.06] text-moon" },
};
const TOI_DA_Y_DINH = 3;
const KHOA_Y_DINH = "hbt.hom_nay_y_dinh";

/** Mã ý định đã chọn hôm nay (chỉ mã, không lưu câu gõ tay); khác ngày → bỏ. */
function docYDinh(homNay: string): string[] {
  try {
    const j = JSON.parse(localStorage.getItem(KHOA_Y_DINH) ?? "null");
    return j && j.ngay === homNay && Array.isArray(j.ma) ? (j.ma as unknown[]).filter((x): x is string => typeof x === "string").slice(0, TOI_DA_Y_DINH) : [];
  } catch { return []; }
}

const KHOA_CHUOI = "hbt.hom_nay";

/** Chuỗi ngày ghé liên tiếp, tính theo ngày xem engine trả (giờ Việt Nam). */
export function capNhatChuoi(cu: { ngay: string; chuoi: number } | null, homNay: string): { ngay: string; chuoi: number } {
  if (!cu) return { ngay: homNay, chuoi: 1 };
  if (cu.ngay === homNay) return cu;
  const hom_qua = new Date(Date.parse(`${homNay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return { ngay: homNay, chuoi: cu.ngay === hom_qua ? cu.chuoi + 1 : 1 };
}

function docChuoi(): { ngay: string; chuoi: number } | null {
  try { const j = JSON.parse(localStorage.getItem(KHOA_CHUOI) ?? "null"); return j && typeof j.ngay === "string" && typeof j.chuoi === "number" ? j : null; }
  catch { return null; }
}

/** "Ngày cá nhân 7: hợp nghỉ…" → "Hợp nghỉ…" (bỏ tiền tố, viết hoa chữ đầu). */
const boTienTo = (s: string) => { const t = s.replace(/^Ngày cá nhân \d+:\s*/, ""); return t.charAt(0).toUpperCase() + t.slice(1); };

const thu = (iso: string) => new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" })
  .format(new Date(`${iso}T00:00:00Z`));

export function HomNay() {
  const hoSo = useHoSo();
  const [the, setThe] = useState<TheHomNay | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [chuoi, setChuoi] = useState<number | null>(null);
  const [daChep, setDaChep] = useState(false);
  const daGhi = useRef(false);
  const [chon, setChon] = useState<string[]>([]);
  const [duDinh, setDuDinh] = useState("");
  const [dangXem, setDangXem] = useState(false);

  /** Gọi engine; `yDinh`/`cau` rỗng = thẻ cơ bản. Ý định đã nhớ của hôm nay được gửi kèm ngay lần đầu. */
  function taiThe(yDinh: string[], cau: string) {
    if (!hoSo) return Promise.reject(new Error("Chưa có hồ sơ"));
    return fetch("/api/thanso/hom-nay", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
        ...(yDinh.length ? { y_dinh: yDinh } : {}), ...(cau.trim() ? { du_dinh: cau.trim().slice(0, 200) } : {}) }),
    }).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Chưa tải được thẻ hôm nay.");
      return j as TheHomNay;
    });
  }

  async function xemYDinh() {
    if (!the || dangXem) return;
    setDangXem(true);
    try {
      const t = await taiThe(chon, duDinh);
      setThe(t); setLoi(null);
      const ma = t.y_dinh_hom_nay.map((x) => x.ma);
      try { localStorage.setItem(KHOA_Y_DINH, JSON.stringify({ ngay: t.ngay_xem, ma })); } catch { /* bỏ qua */ }
      setChon(ma);
      ghi("daily_intent_set", { y_dinh: ma.join(","), go_tay: duDinh.trim() ? 1 : 0 });
      setDuDinh("");
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tải được."); }
    finally { setDangXem(false); }
  }

  function batTat(ma: string) {
    setChon((c) => c.includes(ma) ? c.filter((x) => x !== ma) : c.length >= TOI_DA_Y_DINH ? c : [...c, ma]);
  }

  useEffect(() => {
    if (!hoSo) return;
    let huy = false;
    const homNayVn = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    const daNho = docYDinh(homNayVn);
    setChon(daNho);
    taiThe(daNho, "").then((t) => {
      if (huy) return;
      setThe(t); setLoi(null);
      const moi = capNhatChuoi(docChuoi(), t.ngay_xem);
      try { localStorage.setItem(KHOA_CHUOI, JSON.stringify(moi)); } catch { /* chế độ riêng tư: bỏ qua chuỗi */ }
      setChuoi(moi.chuoi);
      if (!daGhi.current) { daGhi.current = true; ghi("daily_viewed", { chuoi: moi.chuoi }); }
    }).catch((e: Error) => { if (!huy) setLoi(e.message); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- taiThe chỉ đọc hoSo
  }, [hoSo]);

  async function chiaSe() {
    if (!the) return;
    // ?tu=hn.<ngẫu nhiên>: bạn bè mở link → GhiVaoTrang nhớ mã → hồ sơ đầu tiên tính referral_signup (Gate 2, K).
    const tu = `hn.${maNgauNhien(10)}`;
    const url = `${window.location.origin}/hom-nay?tu=${tu}`;
    const chu = `Hôm nay là Ngày cá nhân ${the.ngay_ca_nhan.so} của mình — ${boTienTo(the.ngay_ca_nhan.nghia)} Xem ngày của bạn:`;
    ghi("share_created", { kind: "hom_nay", ma_moi: tu });
    try {
      if (navigator.share) { await navigator.share({ title: "Hôm nay của bạn", text: chu, url }); return; }
      await navigator.clipboard.writeText(`${chu} ${url}`);
      setDaChep(true); setTimeout(() => setDaChep(false), 2500);
    } catch { /* người dùng huỷ chia sẻ */ }
  }

  useBatDauDoc("hom_nay", Boolean(the));
  const tieuDe = <TieuDeMuc cap={1} nho="Mỗi ngày một thẻ" lon="Hôm nay của bạn" />;
  if (hoSo === undefined) return <div className="mx-auto max-w-xl">{tieuDe}<KhungTai /></div>;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        {tieuDe}
        <p className="mb-4 text-fg-muted">Nhập tên và ngày sinh một lần — mỗi ngày mở lại là có thẻ mới.</p>
        <Card><NhapHoSo nutGui="Xem hôm nay của tôi" onXong={() => { /* useHoSo tự cập nhật */ }} /></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl" data-testid="hom-nay">
      {tieuDe}
      {loi && <Card><p role="alert" className="text-sm text-cinnabar">{loi}</p></Card>}
      {!the && !loi && <KhungTai />}
      {the && (
        <div className="space-y-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5 capitalize"><CalendarDays className="size-4" aria-hidden />{thu(the.ngay_xem)}</span>
            <span className="inline-flex items-center gap-1.5"><MoonStar className="size-4" aria-hidden />
              Âm lịch {the.am_lich.ngay}/{the.am_lich.thang}{the.am_lich.nhuan ? " (nhuận)" : ""} · ngày {the.am_lich.can_chi_ngay}, tháng {the.am_lich.can_chi_thang}, năm {the.am_lich.can_chi_nam}</span>
          </p>

          <Card className="space-y-4" data-testid="the-hom-nay">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-fg-muted">{tenGoi(hoSo)}, hôm nay là</p>
                <h2 className="mt-1 text-2xl">Ngày cá nhân <span className="text-gold" data-testid="so-ngay-ca-nhan">{the.ngay_ca_nhan.so}</span></h2>
              </div>
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-4xl text-gold" aria-hidden>{the.ngay_ca_nhan.so}</span>
            </div>
            <p className="text-lg">{boTienTo(the.ngay_ca_nhan.nghia)}</p>
            <div className="rounded-xl border border-moon/30 bg-moon/5 p-4">
              <p className="text-xs uppercase tracking-wider text-moon">Câu hỏi tự soi</p>
              <p className="mt-1">{the.ngay_ca_nhan.tu_soi}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {chuoi !== null && (
                <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted" data-testid="chuoi-ngay">
                  <Flame className="size-4 text-gold" aria-hidden />{chuoi > 1 ? `Bạn ghé ${chuoi} ngày liên tiếp` : "Ngày đầu tiên của chuỗi — mai ghé tiếp nhé"}
                </p>
              )}
              <Button size="sm" variant="secondary" onClick={() => void chiaSe()}><Share2 aria-hidden />{daChep ? "Đã chép link" : "Chia sẻ"}</Button>
            </div>
          </Card>

          {the.hoang_lich && (
            <section aria-labelledby="hl-hom-nay" className="glass space-y-3 rounded-2xl p-5" data-testid="hoang-lich-hom-nay">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="hl-hom-nay" className="text-xl">Hoàng lịch hôm nay</h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${the.hoang_lich.hoang_dao ? "border-gold/50 text-gold" : "border-moon/40 text-moon"}`}>
                  {the.hoang_lich.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} · {the.hoang_lich.than}</span>
              </div>
              <p className="text-sm">Trực <b>{the.hoang_lich.truc}</b> ({the.hoang_lich.truc_y}) · xung tuổi {the.hoang_lich.xung_tuoi}
                {the.hoang_lich.ky_dan_gian.length > 0 && ` · ${the.hoang_lich.ky_dan_gian.join(", ")}`}</p>
              {the.hoang_lich.tuoi && <p className="text-sm" data-testid="hl-tuoi">Tuổi bạn ({the.hoang_lich.tuoi.can_chi}): <b>{the.hoang_lich.tuoi.quan_he.ten}</b> — {the.hoang_lich.tuoi.quan_he.nghia}.</p>}
              <p className="text-sm"><span className="text-fg-muted">Giờ hoàng đạo:</span>{" "}
                {the.hoang_lich.gio_hoang_dao.map((g) => `${g.chi} (${g.khung})`).join(" · ")}</p>
              {the.hoang_lich.nghi.length > 0 && <p className="text-sm"><span className="text-jade">Nên:</span> {the.hoang_lich.nghi.join(", ")}</p>}
              {the.hoang_lich.ky.length > 0 && <p className="text-sm"><span className="text-cinnabar">Kiêng:</span> {the.hoang_lich.ky.join(", ")}</p>}
              <p className="text-sm"><Link href="/xem-ngay-tot" className="text-gold hover:underline">Xem đủ giờ tốt, hướng xuất hành, tìm ngày đẹp →</Link>
                {the.hoang_lich.ngay_tot_gan && <span className="text-fg-muted"> · Ngày đẹp gần nhất: {dmy(the.hoang_lich.ngay_tot_gan.ngay)}</span>}</p>
            </section>
          )}

          <section aria-labelledby="y-dinh" className="glass space-y-4 rounded-2xl p-5" data-testid="y-dinh">
            <div>
              <h2 id="y-dinh" className="text-xl">Hôm nay bạn định làm gì?</h2>
              <p className="mt-1 text-sm text-fg-muted">Chọn tối đa {TOI_DA_Y_DINH} việc hoặc gõ ngắn — xem việc đó hợp nhịp ngày {the.ngay_ca_nhan.so} thế nào và nên làm theo cách nào.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ý định hôm nay">
              {Object.entries(the.danh_sach_y_dinh).map(([ma, y]) => {
                const Icon = ICON[y.bieu_tuong] ?? Sparkles;
                const bat = chon.includes(ma);
                return (
                  <button key={ma} type="button" aria-pressed={bat} title={y.cau_hoi} onClick={() => batTat(ma)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${bat ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/60 hover:text-fg"}`}>
                    <Icon className="size-4" aria-hidden />{y.ten}
                  </button>
                );
              })}
            </div>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void xemYDinh(); }}>
              <label htmlFor="du-dinh" className="sr-only">Dự định hôm nay</label>
              <input id="du-dinh" value={duDinh} maxLength={200} onChange={(e) => setDuDinh(e.target.value)} autoComplete="off"
                placeholder="Hoặc gõ ngắn: chiều nay đi phỏng vấn, tối ôn thi…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm outline-none focus:border-gold" />
              <Button type="submit" size="sm" disabled={dangXem || (!chon.length && !duDinh.trim())}>{dangXem ? "Đang xem…" : "Xem nhịp hôm nay"}</Button>
            </form>
            <p className="text-xs text-fg-faint">Câu bạn gõ chỉ dùng để nhận ra loại việc, không được lưu hay gửi đi nơi khác.</p>

            {the.ho_tro && (
              <div role="alert" className="flex gap-3 rounded-xl border border-cinnabar/40 bg-cinnabar/[0.06] p-4 text-sm" data-testid="ho-tro">
                <LifeBuoy className="mt-0.5 size-5 shrink-0 text-cinnabar" aria-hidden /><p>{the.ho_tro}</p>
              </div>
            )}
            {the.y_dinh_hom_nay.length > 0 && (
              <ul className="space-y-3" data-testid="y-dinh-ket-qua">
                {the.y_dinh_hom_nay.map((x) => {
                  const Icon = ICON[x.bieu_tuong] ?? Sparkles;
                  return (
                    <li key={x.ma} className="rounded-xl border border-line/70 bg-bg/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="inline-flex items-center gap-2 text-lg"><Icon className="size-4 text-gold" aria-hidden />{x.ten}</h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${NHIP[x.nhip].lop}`}>{NHIP[x.nhip].chu}</span>
                      </div>
                      <p className="mt-2 font-medium">{x.nhan}</p>
                      <p className="mt-1 text-sm">{x.cach_lam}</p>
                      <p className="mt-2 text-sm text-moon">Tự soi: {x.tu_soi}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            {the.hoang_lich && the.hoang_lich.viec.length > 0 && the.y_dinh_hom_nay.length > 0 && (
              <ul className="space-y-1 text-sm" data-testid="hl-viec">
                {the.hoang_lich.viec.map((v) => (
                  <li key={v.ma_viec}><span className="text-fg-muted">Theo hoàng lịch, việc {v.ten.toLowerCase()}:</span>{" "}
                    <b className={DANH_GIA_VIEC[v.danh_gia].lop}>{DANH_GIA_VIEC[v.danh_gia].chu}</b>
                    {v.danh_gia !== "tot" && v.ngay_tot_gan && <> — ngày hợp gần nhất <Link href={`/xem-ngay-tot/${v.ngay_tot_gan.ngay}`} className="text-gold hover:underline">{dmy(v.ngay_tot_gan.ngay)}</Link></>}
                  </li>
                ))}
              </ul>
            )}
            {!the.ho_tro && duDinh === "" && chon.length > 0 && the.y_dinh_hom_nay.length === 0 && (
              <p className="text-sm text-fg-muted">Bấm “Xem nhịp hôm nay” để xem các việc đã chọn.</p>
            )}
          </section>

          {the.nhip_bat_tu && (
            <section aria-labelledby="nhip-bat-tu" className="glass space-y-2 rounded-2xl p-5" data-testid="nhip-bat-tu">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="nhip-bat-tu" className="text-xl">Nhịp Bát tự: ngày {the.nhip_bat_tu.thap_than}</h2>
                <span className="text-xs text-fg-muted">nhật chủ {the.nhip_bat_tu.nhat_chu} · ngày {the.nhip_bat_tu.can_chi_ngay}</span>
              </div>
              {the.nhip_bat_tu.y_nghia && <p className="text-sm">{the.nhip_bat_tu.y_nghia}</p>}
              {the.nhip_bat_tu.tinh_cach && <p className="text-sm"><span className="text-jade">Năng lượng gợi ý:</span> {the.nhip_bat_tu.tinh_cach}</p>}
              {the.nhip_bat_tu.cau_tu_soi && <p className="text-sm text-moon">Tự soi: {the.nhip_bat_tu.cau_tu_soi}</p>}
              <p className="text-xs text-fg-faint">{the.nhip_bat_tu.cach_tinh} <Link href="/bat-tu" className="text-gold hover:underline">Xem lá Bát tự đầy đủ</Link></p>
            </section>
          )}

          {the.que_ngay && (
            <section aria-labelledby="que-ngay" className="glass space-y-2 rounded-2xl p-5" data-testid="que-ngay">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="que-ngay" className="text-xl">Quẻ đầu ngày: {the.que_ngay.ten}</h2>
                <span className="text-xs text-fg-muted">quẻ {the.que_ngay.so} · hào {the.que_ngay.hao_dong} động{the.que_ngay.bien ? ` → ${the.que_ngay.bien.ten}` : ""}</span>
              </div>
              {the.que_ngay.y_chinh && <p className="text-sm">{the.que_ngay.y_chinh}</p>}
              {the.que_ngay.loi_khuyen && <p className="text-sm"><span className="text-jade">Gợi ý:</span> {the.que_ngay.loi_khuyen}</p>}
              {the.que_ngay.cau_tu_soi && <p className="text-sm text-moon">Tự soi: {the.que_ngay.cau_tu_soi}</p>}
              <p className="text-xs text-fg-faint">{the.que_ngay.cach_khoi} Mọi người cùng một quẻ trong ngày.{" "}
                {the.que_ngay.duong && <Link href={the.que_ngay.duong} className="text-gold hover:underline">Đọc quẻ {the.que_ngay.ten}</Link>}{" "}
                · <Link href="/kinh-dich" className="text-gold hover:underline">Gieo quẻ cho việc của bạn</Link></p>
            </section>
          )}

          {the.cau_hoi_noi_bat.length > 0 && (
            <section aria-labelledby="noi-bat" className="rounded-2xl border border-line/70 p-5">
              <h2 id="noi-bat" className="inline-flex items-center gap-2 text-lg"><MessageCircleQuestion className="size-5 text-moon" aria-hidden />Câu hỏi nổi bật hôm nay</h2>
              <ul className="mt-3 space-y-2 text-sm">{the.cau_hoi_noi_bat.map((c) => <li key={c} className="border-l-2 border-moon/50 pl-3">{c}</li>)}</ul>
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {the.ngay_pho_quat.nghia && (
              <article className="glass rounded-2xl p-4" data-testid="ngay-pho-quat">
                <div className="flex items-center justify-between text-sm text-fg-muted"><span className="inline-flex items-center gap-1.5"><Globe2 className="size-4" aria-hidden />Ngày chung của mọi người</span>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">số {the.ngay_pho_quat.so}</span></div>
                <p className="mt-2 text-sm">{the.ngay_pho_quat.nghia}</p>
              </article>
            )}
            <article className="glass rounded-2xl p-4" data-testid="ngay-chaldea">
              <div className="flex items-center justify-between text-sm text-fg-muted"><span>Theo phái Chaldea</span>
                <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">số {the.chaldea.so}{the.chaldea.kep ? ` · kép ${the.chaldea.kep}` : ""}</span></div>
              {the.chaldea.nghia_kep ? <p className="mt-2 text-sm"><b>{the.chaldea.nghia_kep.bieu_tuong}</b> — {the.chaldea.nghia_kep.xu_huong}</p>
                : the.chaldea.nghia_goc && <p className="mt-2 text-sm"><b>{the.chaldea.nghia_goc.ten}</b> ({the.chaldea.nghia_goc.hanh_tinh})</p>}
              <p className="mt-1 text-xs text-fg-muted">{the.chaldea.cong_huong
                ? `Trùng số ngày sinh của bạn (${the.chaldea.so_ngay_sinh}) — phái này gọi là ngày cộng hưởng.`
                : `Số ngày sinh của bạn theo Chaldea là ${the.chaldea.so_ngay_sinh}.`} <Link href="/than-so" className="text-gold hover:underline">Xem bài đọc Chaldea</Link></p>
            </article>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[{ nhan: `Tháng ${the.thang_ca_nhan.thang}`, ...the.thang_ca_nhan }, { nhan: `Năm ${the.nam_ca_nhan.nam}`, ...the.nam_ca_nhan }].map((x) => x.chu_de && (
              <article key={x.nhan} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm text-fg-muted"><span>{x.nhan}</span>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">số {x.so}</span></div>
                <h3 className="mt-2 text-lg">{x.chu_de}</h3>
                {x.nen && <p className="mt-1 text-sm"><span className="text-jade">Hợp để:</span> {x.nen}</p>}
                {x.tranh && <p className="mt-1 text-sm"><span className="text-cinnabar">Để ý:</span> {x.tranh}</p>}
              </article>
            ))}
          </div>

          <Card className="flex items-start gap-3">
            <Sunrise className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
            <p className="text-sm"><span className="text-fg-muted">Ngày mai — Ngày cá nhân {the.ngay_mai.so}:</span>{" "}
              {boTienTo(the.ngay_mai.nghia)} <span className="text-fg-muted">Mở lại vào ngày mai để xem câu hỏi mới.</span></p>
          </Card>

          <CuoiBaiDoc moDun="hom_nay" cauHoi="Thẻ hôm nay có giúp bạn định hướng ngày của mình?" />

          <p className="text-xs text-fg-faint">{the.luu_y} Muốn hiểu sâu hơn: <Link href="/ban-than" className="text-gold hover:underline">bài đọc đầy đủ</Link> ·{" "}
            <Link href="/hop-doi" className="text-gold hover:underline">xem hợp với ai</Link>.</p>
        </div>
      )}
    </div>
  );
}
