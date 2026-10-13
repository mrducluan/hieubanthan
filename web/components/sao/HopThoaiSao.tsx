"use client";
// SAO-2 — hộp thoại dùng chung khi gặp "cửa Sao" (lib/sao-client.ts). Ba tình huống:
//   dang_nhap    hết lượt miễn phí / muốn mở báo cáo khi chưa đăng nhập → đăng nhập 30 giây, nhận Sao chào mừng
//   xac_nhan_sao hết câu miễn phí hôm nay → "Hỏi tiếp: 1 Sao" (có ô "không hỏi lại trong phiên này")
//   nap          ví không đủ → chưa nhận quà chào mừng thì mời LƯU HỒ SƠ (người dùng bấm) nhận Sao ngay tại chỗ;
//                nạp nhanh (chọn gói đủ dùng, QR ngân hàng) rồi QUAY VỀ đúng trang; luôn có lối mời bạn bè nhận Sao
// Giọng: nói rõ giá trị người dùng nhận được và cái giá, không doạ, không đếm ngược giả, luôn có lối "để sau".
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Loader2, QrCode, Sparkles, UserPlus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { QUAY_VE, TU_DONG_Y, dangKyHopThoaiSao, xoaChoMo, type YeuCauSao } from "@/lib/sao-client";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { useHoSo } from "@/lib/hoso";
import { hoSoTaiKhoan, luuVaoTaiKhoan } from "@/lib/tai-khoan";
import { maGioiThieuDaNho, nhanChaoMung, nhanThuongGioiThieu, quenMaGioiThieu } from "@/lib/sao";

type Goi = { ma: string; ten: string; gia_vnd: number; sao: number; nhan: string | null; mo_ta: string | null };
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
const ghiPhien = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* chế độ riêng tư */ } };
const duongHienTai = () => `${window.location.pathname}${window.location.search}`;

export function HopThoaiSao() {
  const [y, setY] = useState<YeuCauSao | null>(null);
  const tra = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => dangKyHopThoaiSao((yc) => new Promise<boolean>((r) => {
    tra.current?.(false);
    tra.current = r;
    setY(yc);
    // paywall_viewed của báo cáo đã ghi khi hiện bản xem trước — ở đây chỉ ghi hết lượt hỏi đáp.
    if (yc.nguon === "hoi") ghi("quota_reached", { kind: yc.can, nguon: yc.nguon, mo_dun: yc.mo_dun });
  })), []);

  const dong = (v: boolean) => {
    ghi("sao_prompt_answered", { kind: y?.can, ket_qua: v ? "dong_y" : "de_sau", nguon: y?.nguon });
    if (!v) xoaChoMo();   // "Để sau" / đóng hộp → không tự mở lại khi quay về trang
    tra.current?.(v); tra.current = null; setY(null);
  };
  // Đi sang trang khác (đăng nhập, nạp, mời bạn) → đóng hộp nhưng GIỮ báo cáo chờ mở để quay về tự mở.
  const path = usePathname();
  const pathTruoc = useRef(path);
  useEffect(() => {
    if (pathTruoc.current === path) return;
    pathTruoc.current = path;
    tra.current?.(false); tra.current = null; setY(null);
  }, [path]);

  if (!y) return null;
  const tieuDe = y.can === "dang_nhap"
    ? (y.nguon === "hoi" ? "Hết câu hỏi miễn phí hôm nay" : "Mở toàn bộ báo cáo của bạn")
    : y.can === "xac_nhan_sao" ? "Hỏi tiếp câu này?" : "Nạp thêm Sao để xem tiếp";
  return (
    <Sheet open onOpenChange={(o) => { if (!o) dong(false); }}>
      <SheetContent title={tieuDe} description={y.error} data-testid="hop-thoai-sao" data-can={y.can}>
        {y.can === "dang_nhap" && <DangNhapNhan y={y} />}
        {y.can === "xac_nhan_sao" && <XacNhan y={y} dong={dong} />}
        {y.can === "nap" && (
          <div className="space-y-5">
            {y.chao_mung ? <NhanChaoMung y={y} xong={() => dong(true)} /> : null}
            <NapNhanh can={Math.max(0, (y.gia ?? 0) - (y.so_du ?? 0))} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DangNhapNhan({ y }: { y: YeuCauSao }) {
  const tiep = typeof window === "undefined" ? "/" : duongHienTai();
  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm text-fg-muted">
        {y.thuong ? <li className="flex gap-2"><Gift className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          Lưu hồ sơ vào tài khoản: <b className="text-fg">tặng {y.thuong} Sao</b>{y.gia && y.thuong >= y.gia ? " — đủ mở ngay báo cáo này." : "."}</li> : null}
        {y.nguon === "hoi" && <li className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />Có tài khoản: thêm câu hỏi miễn phí mỗi ngày.</li>}
        <li className="flex gap-2"><UserPlus className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />Mời bạn bè: mỗi người bạn đăng ký, cả hai cùng nhận Sao.</li>
      </ul>
      <p className="text-xs text-fg-faint">Đăng nhập bằng email hoặc Google, không cần mật khẩu. Hồ sơ của bạn vẫn có thể chỉ lưu trên máy.</p>
      <Button asChild className="w-full" onClick={() => ghiPhien(QUAY_VE, tiep)}>
        <Link href={`/dang-nhap?tiep=${encodeURIComponent(tiep)}`} data-testid="sao-dang-nhap">Đăng nhập để xem tiếp</Link>
      </Button>
    </div>
  );
}

/** Tài khoản chưa nhận quà: lưu hồ sơ đang dùng trên máy vào tài khoản (người dùng bấm — không tự lưu; tài khoản ĐÃ có
 *  hồ sơ thì giữ nguyên, chỉ nhận quà) → +Sao chào mừng (+ thưởng lời mời nếu đến từ link mời) → đủ Sao thì gửi lại
 *  yêu cầu (lib/sao-client fetchSao), chưa đủ thì ở lại hộp để nạp phần còn thiếu. */
function NhanChaoMung({ y, xong }: { y: YeuCauSao; xong: () => void }) {
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daNhan, setDaNhan] = useState<number | null>(null);
  const [tkCoHoSo, setTkCoHoSo] = useState<boolean | null>(null);
  const hs = useHoSo() ?? null;
  useEffect(() => {
    void (async () => {
      const uid = (await (await supabase())?.auth.getUser())?.data.user?.id;
      if (uid) setTkCoHoSo(Boolean(await hoSoTaiKhoan(uid).catch(() => null)));
    })();
  }, []);
  const du = (y.chao_mung ?? 0) + (y.so_du ?? 0) >= (y.gia ?? 0);
  async function nhan() {
    setDang(true); setLoi(null);
    try {
      const uid = (await (await supabase())?.auth.getUser())?.data.user?.id;
      if (!uid) throw new Error("Phiên đăng nhập đã hết — đăng nhập lại rồi thử.");
      if (!tkCoHoSo) {
        if (!hs) throw new Error("Chưa có hồ sơ trên máy — lưu ở trang Tài khoản.");
        await luuVaoTaiKhoan(uid, hs);
        ghi("profile_created", { kind: "tai_khoan", nguon: "hop_sao" });
      }
      const r = await nhanChaoMung();
      if (r.ket_qua !== "da_thuong" && r.ket_qua !== "da_nhan") throw new Error("Chưa nhận được Sao chào mừng, thử lại sau.");
      let them = r.ket_qua === "da_thuong" ? r.sao ?? 0 : 0;
      if (them) ghi("credit_earned", { kind: "chao_mung", so_sao: them });
      // Đến từ link mời: nhận thưởng hai phía luôn (như trang Tài khoản), không đợi người dùng ghé /tai-khoan.
      const gt = maGioiThieuDaNho();
      if (gt) {
        const m = await nhanThuongGioiThieu(gt).catch(() => null);
        if (m?.ket_qua === "da_thuong") { them += m.sao ?? 0; ghi("credit_earned", { kind: "duoc_moi", so_sao: m.sao }); }
        if (m && m.ket_qua !== "chua_luu_ho_so") quenMaGioiThieu();
      }
      if ((y.so_du ?? 0) + them >= (y.gia ?? 0)) { xong(); return; }
      setDaNhan(them); setDang(false);
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa lưu được."); setDang(false); }
  }
  if (daNhan !== null) {
    return <p className="rounded-2xl border border-jade/40 bg-jade/5 p-4 text-sm text-fg" data-testid="da-nhan-chao-mung">
      Đã nhận {daNhan} Sao. Ví còn thiếu {Math.max(0, (y.gia ?? 0) - (y.so_du ?? 0) - daNhan)} Sao — nạp thêm bên dưới hoặc mời bạn bè.</p>;
  }
  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4" data-testid="nhan-chao-mung">
      <p className="flex gap-2 text-sm text-fg"><Gift className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
        <span>{tkCoHoSo
          ? <>Quà chào mừng: <b className="text-gold">{y.chao_mung} Sao</b> cho tài khoản đã lưu hồ sơ{du ? " — đủ mở ngay." : "."}</>
          : <>Quà chào mừng: lưu hồ sơ <b>{hs?.ho_ten ?? "của bạn"}</b> vào tài khoản để nhận <b className="text-gold">{y.chao_mung} Sao</b>{du ? " — đủ mở ngay." : "."}</>}</span></p>
      {!tkCoHoSo && (
        <p className="mt-1 text-xs text-fg-faint">Bấm nút là bạn đồng ý lưu <b>họ tên, ngày giờ sinh, giới tính, nơi sinh</b> vào tài khoản để dùng trên máy khác.
          Nội dung bài đọc và câu hỏi không được lưu. Xoá được bất cứ lúc nào ở trang Tài khoản.{" "}
          <Link href="/chinh-sach-rieng-tu#du-lieu" className="text-gold underline">Chính sách quyền riêng tư</Link></p>
      )}
      {tkCoHoSo === null ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-fg-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Đang kiểm tra tài khoản…</p>
      ) : tkCoHoSo || hs ? (
        <Button className="mt-3 w-full" onClick={() => void nhan()} disabled={dang} data-testid="nhan-chao-mung-nut">
          {dang ? <Loader2 className="animate-spin" aria-hidden /> : <Gift aria-hidden />} {tkCoHoSo ? `Nhận ${y.chao_mung} Sao` : `Lưu hồ sơ · nhận ${y.chao_mung} Sao`}
        </Button>
      ) : (
        <Button asChild variant="secondary" className="mt-3 w-full"><Link href="/tai-khoan">Lưu hồ sơ ở trang Tài khoản</Link></Button>
      )}
      {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
    </div>
  );
}

function XacNhan({ y, dong }: { y: YeuCauSao; dong: (v: boolean) => void }) {
  const [nho, setNho] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        Câu này dùng <b className="text-gold">{y.gia} Sao</b> · ví còn <b className="text-fg">{y.so_du} Sao</b>.
        Chỉ trừ khi đã trả lời được. Ngày mai bạn lại có {y.tran} câu miễn phí.
      </p>
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        <input type="checkbox" checked={nho} onChange={(e) => setNho(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" />
        Không hỏi lại trong phiên này
      </label>
      <div className="flex gap-3">
        <Button className="flex-1" data-testid="sao-dong-y" onClick={() => { if (nho) ghiPhien(TU_DONG_Y, "1"); dong(true); }}>
          <Sparkles aria-hidden /> Dùng {y.gia} Sao
        </Button>
        <Button variant="secondary" onClick={() => dong(false)}>Để mai</Button>
      </div>
    </div>
  );
}

/** Nạp ngay trong hộp thoại: gói gợi ý = gói nhỏ nhất đủ phần còn thiếu. Sau khi trả tiền, /nap-sao/ket-qua đưa về đây. */
export function NapNhanh({ can = 0 }: { can?: number }) {
  const [ds, setDs] = useState<Goi[] | null>(null);
  const [cong, setCong] = useState<string | null>(null);
  const [chon, setChon] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghi("checkout_viewed", { kind: "nap_nhanh" });
    fetch("/api/thanh-toan/goi").then((r) => r.json()).then((d: { goi: Goi[]; cong: string | null }) => {
      setDs(d.goi); setCong(d.cong);
      const du = d.goi.filter((g) => g.sao >= can).sort((a, b) => a.gia_vnd - b.gia_vnd)[0];
      setChon((du ?? d.goi.find((g) => g.nhan) ?? d.goi[0])?.ma ?? "");
    }).catch(() => setDs([]));
  }, [can]);

  async function nap() {
    setDang(true); setLoi(null);
    ghi("checkout_started", { kind: chon, nguon: "nap_nhanh" });
    try {
      const sb = await supabase();
      const token = (await sb?.auth.getSession())?.data.session?.access_token;
      if (!token) { window.location.href = `/dang-nhap?tiep=${encodeURIComponent(duongHienTai())}`; return; }
      ghiPhien(QUAY_VE, duongHienTai());
      const r = await fetch("/api/thanh-toan/tao-don", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ goi: chon }),
      });
      const j = (await r.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!r.ok || !j.checkoutUrl) throw new Error(j.error ?? "Chưa tạo được đơn.");
      window.location.href = j.checkoutUrl;
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tạo được đơn."); setDang(false); }
  }

  if (!ds) return <p className="inline-flex items-center gap-2 text-sm text-fg-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Đang tải gói…</p>;
  if (!cong) return <p className="text-sm text-fg-muted">Nạp Sao đang chuẩn bị mở. Trong lúc chờ, mời bạn bè ở trang <Link href="/tai-khoan" className="text-gold underline">Tài khoản</Link> để nhận Sao.</p>;
  const g = ds.find((x) => x.ma === chon);
  return (
    <div className="space-y-4" data-testid="nap-nhanh">
      <div className="grid gap-2">
        {ds.map((x) => (
          <label key={x.ma} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${chon === x.ma ? "border-gold bg-gold/5" : "border-line/70 hover:border-gold/50"}`}>
            <input type="radio" name="goi-nhanh" value={x.ma} checked={chon === x.ma} onChange={() => setChon(x.ma)} className="sr-only" />
            <Sparkles className="size-4 text-gold" aria-hidden />
            <span className="flex-1"><b className="text-fg">{x.sao} Sao</b> <span className="text-xs text-fg-faint">{x.mo_ta}</span></span>
            {x.nhan && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-bg">{x.nhan}</span>}
            <span className="text-sm text-fg">{vnd(x.gia_vnd)}</span>
          </label>
        ))}
      </div>
      <Button className="w-full" onClick={() => void nap()} disabled={dang || !g} data-testid="nap-nhanh-nut">
        {dang ? <Loader2 className="animate-spin" aria-hidden /> : <QrCode aria-hidden />}
        {g ? `Quét QR nạp ${g.sao} Sao · ${vnd(g.gia_vnd)}` : "Chọn gói"}
      </Button>
      <p className="text-xs text-fg-faint">App ngân hàng / ví bất kỳ có VietQR. Sao vào ví trong vài giây, rồi bạn quay lại đúng trang này. Sao không đổi ra tiền, Sao mua không hết hạn.</p>
      <p className="text-sm text-fg-muted"><UserPlus className="mr-1.5 inline size-4 align-[-3px] text-gold" aria-hidden />
        Hoặc <Link href="/tai-khoan" className="text-gold underline">mời bạn bè</Link> — mỗi người bạn đăng ký, cả hai cùng nhận Sao.</p>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
    </div>
  );
}
