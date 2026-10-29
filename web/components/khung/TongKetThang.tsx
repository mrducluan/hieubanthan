"use client";
// KV-THANG — "Tháng của tôi": tổng kết tháng TRƯỚC (kể lại, thì quá khứ) + thẻ chia sẻ + lối sang chương "12 tháng tới".
//   Nguồn số: tài khoản (diem_danh 0032 trả thang_truoc; ở Bản thân đọc thẳng bảng nhat_ky_ghe qua RLS — không ghi lượt ghé)
//   → không có thì nhật ký trên máy của đúng hồ sơ này (lib/nhat-ky-ngay). Chỉ hiện khi tháng trước ghé ≥ 3 ngày và chưa bấm
//   đóng tháng đó (máy nhớ). Không "mục tiêu / kỷ lục / còn N ngày", không so % với tháng trước, không hứa Sao.
//   Thẻ chia sẻ: máy chủ ký (/api/chia-se/thang, engine tính tháng cá nhân) — chỉ tên gọi + tháng + tháng cá nhân + ngày đã
//   ghé; link /the/thang/<mã>?tu=tk.… (+ ?gt= khi đã đăng nhập). Ảnh /og/thang (dọc) có QR + hieuban.com.
//   CTA Sao: Link sang /than-so#ban-do-con-so (chương "12 tháng tới" thuộc Bản đồ con số, mở cả gói theo SAO-2) — hộp thoại
//   Sao chỉ sống khi báo cáo đang mount nên ở đây không trừ Sao, chỉ dẫn đường; thu_sao tắt → "đang miễn phí".
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChepTay, guiHoacChep } from "@/components/chia-se/GuiLink";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { tenGoi, type HoSo } from "@/lib/hoso";
import { DANH_MUC, huyHieuMay } from "@/lib/huy-hieu";
import { oLichThang, soNgayTrongThang, THU_NGAN } from "@/lib/lich-thang";
import { docNhatKy, thangTruoc, thongKeThang, type ThongKeThang } from "@/lib/nhat-ky-ngay";
import { useMaCuaToi, type DiemDanh } from "@/lib/sao";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";
import { useNguoiDung } from "@/lib/tai-khoan";
import { docDaDong, ghiDaDong, loiTongKet, nenHienTongKet, NGUONG_NGAY_TONG_KET, type TongKet } from "@/lib/tong-ket-thang";

export const maMoiThang = () => `tk.${maNgauNhien(10)}`;

type Nguon = "may" | "tai_khoan";

/** Thống kê tháng trước: ưu tiên máy chủ (diem_danh / bảng), rồi máy. `thangNay` của engine chỉ thêm vào khi được truyền. */
/** Thống kê tháng trước: `mayChu` undefined = còn chờ /api/sao/chuoi (chỉ chờ khi có tài khoản), null = máy chủ không có số.
 *  Máy chủ có số nhưng dưới ngưỡng hiện (vd. tháng trước còn là khách) mà nhật ký máy đủ → dùng máy. */
function useTongKet(hoSo: HoSo, homNay: string, mayChu: DiemDanh["thang_truoc"] | null | undefined, docBang: boolean): { tk: TongKet; nguon: Nguon } | null | undefined {
  const [kq, setKq] = useState<{ tk: TongKet; nguon: Nguon } | null | undefined>(undefined);
  useEffect(() => {
    let huy = false;
    const { nam, thang } = thangTruoc(homNay);
    const ds = docNhatKy(hoSo);
    const may = thongKeThang(ds, nam, thang);
    const tien = `${nam}-${String(thang).padStart(2, "0")}-`;
    // Huy hiệu máy đạt trong tháng đó (ngày đạt nằm trong tháng); huy hiệu tài khoản tính ở máy chủ không kéo về đây (gọn).
    const hhMoi = huyHieuMay(hoSo).filter((h) => h.dat && h.luc?.startsWith(tien)).map((h) => h.ma);
    const ghep = (t: ThongKeThang, nguon: Nguon) => {
      if (nguon === "tai_khoan" && t.so_ngay < NGUONG_NGAY_TONG_KET && may.so_ngay >= NGUONG_NGAY_TONG_KET) { t = may; nguon = "may"; }
      setKq({ tk: { ...t, thang_ca_nhan: t.thang_ca_nhan ?? may.thang_ca_nhan, huy_hieu_moi: hhMoi }, nguon });
    };
    if (mayChu === undefined && !docBang && coTaiKhoan()) { setKq(undefined); return; }   // chờ máy chủ, không đo "may" rồi đổi
    if (mayChu && mayChu.nam === nam && mayChu.thang === thang) {
      ghep({ nam, thang, so_ngay: mayChu.so_ngay, ngay: mayChu.ngay, so_la: mayChu.so_la, so_khac: mayChu.so_khac, du_9: mayChu.du_9, thang_ca_nhan: may.thang_ca_nhan }, "tai_khoan");
      return;
    }
    if (!docBang || !coTaiKhoan()) { ghep(may, "may"); return; }
    void (async () => {
      try {
        const sb = await supabase();
        const uid = (await sb?.auth.getSession())?.data.session?.user.id;
        if (!sb || !uid) { if (!huy) ghep(may, "may"); return; }
        const tu = `${tien}01`, den = `${tien}${String(soNgayTrongThang(nam, thang)).padStart(2, "0")}`;   // "-31" ở tháng 30 ngày → Postgres báo 400
        const { data, error } = await sb.from("nhat_ky_ghe").select("ngay,so,la").gte("ngay", tu).lte("ngay", den);
        if (huy) return;
        if (error || !data) { ghep(may, "may"); return; }
        const dong = (data as { ngay: string; so: number | null; la: string | null }[]).map((r) => ({ n: r.ngay, s: r.so ?? 0, ...(r.la ? { l: r.la } : {}) }));
        const t = thongKeThang(dong.filter((m) => m.s >= 1), nam, thang);
        ghep({ ...t, so_ngay: dong.length, ngay: [...new Set(dong.map((m) => Number(m.n.slice(8, 10))))].sort((a, b) => a - b) }, "tai_khoan");
      } catch { if (!huy) ghep(may, "may"); }
    })();
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hoSo đổi thì trang dựng lại
  }, [homNay, mayChu, docBang]);
  return kq;
}

export function TongKetThang({ hoSo, homNay, mayChu, thangNay, noi, className = "" }: {
  hoSo: HoSo; homNay: string; mayChu?: DiemDanh["thang_truoc"] | null;
  /** Tháng cá nhân của THÁNG NÀY (engine /hom-nay trả) — chỉ truyền ở Hôm nay; Bản thân đã có khối nhịp riêng. */
  thangNay?: { so: number; chu_de: string | null; nen: string | null } | null;
  noi: "hom_nay" | "ban_than"; className?: string;
}) {
  const kq = useTongKet(hoSo, homNay, mayChu, noi === "ban_than");
  const [dong, setDong] = useState<string | null | undefined>(undefined);
  const [phi, setPhi] = useState<{ thu: boolean; gia: number } | null>(null);
  const [the, setThe] = useState<{ ma: string; tu: string; url: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [daChep, setDaChep] = useState(false);
  const [chepTay, setChepTay] = useState<string | null>(null);
  const daDo = useRef(false);
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  useEffect(() => { setDong(docDaDong()); }, []);
  useEffect(() => {
    fetch("/api/luan-giai/phi").then((r) => (r.ok ? r.json() : null))
      .then((d: { thu?: boolean; gia?: number } | null) => setPhi({ thu: Boolean(d?.thu), gia: Number(d?.gia) || 0 }))
      .catch(() => setPhi({ thu: false, gia: 0 }));
  }, []);
  const hien = Boolean(kq && dong !== undefined && nenHienTongKet(kq.tk, dong ?? null));
  useEffect(() => {
    if (!hien || !kq || daDo.current) return;
    daDo.current = true;
    ghi("recap_viewed", { so_thang: kq.tk.thang, so_ngay: kq.tk.so_ngay, nguon: kq.nguon, tu: noi });
  }, [hien, kq, noi]);
  if (!hien || !kq) return null;
  const { tk, nguon } = kq;
  const ghe = new Set(tk.ngay);

  const dongLai = () => { ghiDaDong(tk.nam, tk.thang); setDong(`${tk.nam}-${String(tk.thang).padStart(2, "0")}`); ghi("recap_closed", { so_thang: tk.thang, so_ngay: tk.so_ngay }); };

  async function chiaSe() {
    setDang(true); setChepTay(null);
    try {
      let t = the;
      if (!t) {
        const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/thang", {
          ten_hien_thi: tenGoi(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, nam_xem: tk.nam, thang_xem: tk.thang, ngay_ghe: tk.ngay,
        });
        const u = new URL(`/the/thang/${ma}`, window.location.origin);
        u.searchParams.set("tu", tu);
        if (maCuaToi) u.searchParams.set("gt", maCuaToi);
        t = { ma, tu, url: u.toString() };
        setThe(t);
        ghi("share_created", { kind: "thang", ma_moi: tu, co_ma: Boolean(maCuaToi) });
      }
      const chu = `Tháng ${tk.thang} mình ghé Hôm nay ${tk.so_ngay} buổi sáng. Còn tháng này của bạn là tháng mấy?`;
      const kqGui = await guiHoacChep({ title: "Tháng của tôi", text: chu, url: t.url }, `${chu} ${t.url}`);
      if (kqGui === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2500); }
      else if (kqGui === "khong_duoc") setChepTay(t.url);
    } catch { setChepTay(null); }
    finally { setDang(false); }
  }

  const cau = loiTongKet(tk, (ma) => DANH_MUC[ma as keyof typeof DANH_MUC]?.ten ?? ma);
  const loiSao = phi === null ? "" : !phi.thu ? "Đang miễn phí" : phi.gia > 0 ? `${phi.gia} Sao · hội viên mở sẵn` : "";
  return (
    <section aria-labelledby="tong-ket-thang" className={`glass relative rounded-2xl p-5 ${className}`} data-testid="tong-ket-thang" data-nguon={nguon} data-so-ngay={tk.so_ngay}>
      <button type="button" onClick={dongLai} aria-label="Đóng tổng kết tháng" data-testid="tong-ket-dong"
        className="vung-cham absolute right-3 top-3 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg">
        <X className="size-4" aria-hidden />
      </button>
      <p className="eyebrow">Tháng của tôi</p>
      <h2 id="tong-ket-thang" className="mt-1 text-xl">Tháng {tk.thang} vừa rồi của bạn</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className="mx-auto grid w-full max-w-[17rem] grid-cols-7 gap-1 sm:mx-0 sm:w-56" role="img" aria-label={`Lịch tháng ${tk.thang}: ${tk.so_ngay} ngày đã ghé`} data-testid="tong-ket-lich">
          {THU_NGAN.map((t) => <span key={t} className="text-center text-[0.6rem] uppercase tracking-wider text-fg-faint">{t}</span>)}
          {oLichThang(tk.nam, tk.thang).map((d, i) => (
            <span key={i} className={`grid aspect-square place-items-center rounded-full text-[0.7rem] tabular-nums ${d === null ? "" : ghe.has(d) ? "bg-gold font-semibold text-bg" : "text-fg-faint"}`}
              data-ghe={d !== null && ghe.has(d) ? 1 : undefined}>{d ?? ""}</span>
          ))}
        </div>
        <div className="space-y-2 text-sm">
          <ul className="space-y-1" data-testid="tong-ket-cau">
            {cau.map((c) => <li key={c}>{c}</li>)}
          </ul>
          {nguon === "may" && <p className="text-xs text-fg-faint">Đếm trên máy này. Đăng nhập để giữ trên mọi máy.</p>}
          {thangNay && thangNay.chu_de && (
            <p className="rounded-xl border border-moon/30 bg-moon/5 px-3 py-2" data-testid="tong-ket-thang-nay">
              Tháng này là <b>tháng cá nhân {thangNay.so}</b> — {thangNay.chu_de}{thangNay.nen ? `. ${thangNay.nen}` : "."}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => void chiaSe()} disabled={dang} data-testid="tong-ket-chia-se">
              {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? "Đã chép link" : dang ? "Đang tạo…" : "Chia sẻ tháng của tôi"}
            </Button>
            {the && (
              <a href={`/og/thang?ma=${encodeURIComponent(the.ma)}&tu=${the.tu}&khung=doc`} download={`thang-${tk.thang}-cua-toi.png`}
                onClick={() => ghi("share_created", { kind: "thang_anh", ma_moi: the.tu, co_ma: false })}
                className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg" data-testid="tong-ket-tai-anh">
                <Download className="size-4" aria-hidden /> Tải ảnh
              </a>
            )}
          </div>
          {chepTay && <ChepTay url={chepTay} className="w-full" />}
          <Link href="/than-so#ban-do-con-so" onClick={() => ghi("sao_cta_clicked", { tu: "tong_ket", so_chuong: 3 })}
            className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 hover:border-gold" data-testid="tong-ket-12-thang">
            <span className="flex items-start gap-2">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <span><span className="block font-medium text-fg">Đọc kỹ 12 tháng tới của bạn</span>
                <span className="text-xs text-fg-muted">Chương "12 tháng tới" trong Bản đồ con số{loiSao ? ` · ${loiSao}` : ""}</span></span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-gold" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
