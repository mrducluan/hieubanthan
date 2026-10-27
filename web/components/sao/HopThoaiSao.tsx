"use client";
// SAO-2 — hộp thoại dùng chung khi gặp "cửa Sao" (lib/sao-client.ts). Ba tình huống:
//   dang_nhap    hết lượt miễn phí / muốn mở báo cáo khi chưa đăng nhập → đăng nhập 30 giây, nhận Sao chào mừng
//   xac_nhan_sao hết câu miễn phí hôm nay → "Hỏi tiếp: 1 Sao" (có ô "không hỏi lại trong phiên này")
//   nap          ví không đủ → chưa nhận quà chào mừng thì mời LƯU HỒ SƠ (người dùng bấm) nhận Sao ngay tại chỗ;
//                nạp nhanh (chọn gói đủ dùng, QR ngân hàng) rồi QUAY VỀ đúng trang; luôn có lối mời bạn bè nhận Sao
// Giọng: nói rõ giá trị người dùng nhận được và cái giá, không doạ, không đếm ngược giả, luôn có lối "để sau".
// Cửa Sao v2 "Ba lối mở" (docs/CUA-SAO-V2.md): thanh ví + ba thẻ ngang hàng — Đọc ngay (QR, một gói vừa đủ) · Miễn phí,
// mời bạn (gửi ngay trong hộp, con số thật từ cài đặt) · Hội viên năm (khi bật). Câu chữ: lib/loi-sao.ts.
import { useEffect, useRef, useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Gift, Loader2, QrCode, Sparkles, UserPlus, Zap } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { QUAY_VE, TU_DONG_Y, dangKyHopThoaiSao, xoaChoMo, type YeuCauSao } from "@/lib/sao-client";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { useHoSo } from "@/lib/hoso";
import { hoSoTaiKhoan, luuVaoTaiKhoan } from "@/lib/tai-khoan";
import { maGioiThieuDaNho, nhanChaoMung, nhanThuongGioiThieu, quenMaGioiThieu } from "@/lib/sao";
import {
  dongNapDau, goiGoiY, hienNapDau, saoTangLanDau, soBaoCao, thuocTinhNap, type GoiHienThi, type NapDau,
} from "@/lib/thanh-toan/nap-dau";
import { docHoiVien, hienDongHoiVien, type HoiVien } from "@/lib/thanh-toan/hoi-vien";
import { useMucSao } from "@/lib/muc-sao";
import { loiKhachHetLuot, soBanCanMoi, soCau } from "@/lib/loi-sao";
import { ThanhVi, TheHoiVien, TheMoiBan } from "@/components/sao/LoiMoSao";

type Goi = GoiHienThi;
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
    ? (y.nguon === "hoi" ? "Hết câu hỏi miễn phí hôm nay" : y.nguon === "nhiem_vu" ? "Đăng nhập để nhận Sao" : "Đọc tiếp báo cáo của bạn")
    : y.can === "xac_nhan_sao" ? "Hỏi tiếp câu này?" : y.nguon === "hoi" ? "Hỏi tiếp bằng Sao" : "Chọn cách đọc tiếp";
  return (
    <Sheet open onOpenChange={(o) => { if (!o) dong(false); }}>
      {/* Hộp nạp: thanh ví thay câu "ví còn N Sao" của máy chủ (câu đó cũ đi ngay khi nhận quà trong hộp). */}
      <SheetContent title={tieuDe} description={y.can === "nap" ? undefined : y.error} data-testid="hop-thoai-sao" data-can={y.can}>
        {y.can === "dang_nhap" && <DangNhapNhan y={y} />}
        {y.can === "xac_nhan_sao" && <XacNhan y={y} dong={dong} />}
        {y.can === "nap" && <HopNap y={y} xong={() => dong(true)} />}
      </SheetContent>
    </Sheet>
  );
}

function DangNhapNhan({ y }: { y: YeuCauSao }) {
  const tiep = typeof window === "undefined" ? "/" : duongHienTai();
  const muc = useMucSao();
  const moi = muc?.moi_ban ?? 0;
  const qua = y.thuong ?? 0;
  const hoi = y.nguon === "hoi";
  // Báo cáo: quà chào mừng + thưởng mời bạn đủ giá → nói thẳng "đủ mở mà không tốn đồng nào" (phép cộng hiện ra).
  const kMoi = !hoi && y.gia ? soBanCanMoi(y.gia - qua, moi) : null;
  const nut = y.nguon === "nhiem_vu" ? "Đăng nhập để nhận Sao" : hoi ? "Đăng nhập để hỏi tiếp" : qua ? `Đăng nhập · nhận ${qua} Sao` : "Đăng nhập để đọc tiếp";
  return (
    <div className="space-y-4">
      {qua > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/5 p-4" data-testid="qua-dang-nhap">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold"><Gift className="size-5" aria-hidden /></span>
          <div className="text-sm">
            <p className="text-fg">Đăng nhập 30 giây — nhận ngay <b className="text-gold">{qua} Sao</b> khi lưu hồ sơ vào tài khoản.</p>
            {!hoi && y.gia ? (
              <p className="mt-1 text-fg-muted">{qua >= y.gia ? "Đủ mở ngay báo cáo này." : `Báo cáo này ${y.gia} Sao — còn thiếu ${y.gia - qua} Sao.`}</p>
            ) : null}
            {hoi && <p className="mt-1 text-fg-muted" data-testid="khach-het-luot">{loiKhachHetLuot({ tranTk: y.tran_tk, tranKhach: y.tran, thuong: qua, gia: y.gia })}</p>}
          </div>
        </div>
      )}
      {moi > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-line/70 p-4 text-sm" data-testid="duong-mien-phi">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-jade/15 text-jade"><UserPlus className="size-5" aria-hidden /></span>
          <p className="text-fg-muted">
            {hoi
              ? <>Mời bạn bè: mỗi bạn nhận lời mời, bạn thêm <b className="text-fg">{moi} Sao</b>{soCau(moi, y.gia ?? 0) > 0 ? ` (${soCau(moi, y.gia ?? 0)} câu hỏi)` : ""}.</>
              : kMoi === 0 ? <>Mời bạn bè: mỗi bạn nhận lời mời, bạn thêm <b className="text-fg">{moi} Sao</b> cho lần sau.</>
              : kMoi === 1 ? <><b className="text-fg">Đọc miễn phí:</b> {qua} Sao quà + mời 1 bạn ({moi} Sao) là đủ {y.gia} Sao — không tốn đồng nào.</>
              : <>Mời bạn bè: mỗi bạn nhận lời mời, bạn thêm <b className="text-fg">{moi} Sao</b>.</>}
          </p>
        </div>
      )}
      <Button asChild className="w-full" onClick={() => ghiPhien(QUAY_VE, tiep)}>
        <Link href={`/dang-nhap?tiep=${encodeURIComponent(tiep)}`} data-testid="sao-dang-nhap">{nut}</Link>
      </Button>
      <p className="text-xs text-fg-faint">Email hoặc Google, không cần mật khẩu. Hồ sơ của bạn vẫn có thể chỉ lưu trên máy.
        {hoi && y.tran ? ` Không vội thì ngày mai bạn lại có ${y.tran} câu miễn phí.` : ""}</p>
    </div>
  );
}

/** Tài khoản chưa nhận quà: lưu hồ sơ đang dùng trên máy vào tài khoản (người dùng bấm — không tự lưu; tài khoản ĐÃ có
 *  hồ sơ thì giữ nguyên, chỉ nhận quà) → +Sao chào mừng (+ thưởng lời mời nếu đến từ link mời) → đủ Sao thì gửi lại
 *  yêu cầu (lib/sao-client fetchSao), chưa đủ thì ở lại hộp để nạp phần còn thiếu. */
function HopNap({ y, xong }: { y: YeuCauSao; xong: () => void }) {
  const [them, setThem] = useState(0);   // Sao vừa nhận trong hộp (quà) → gói gợi ý chỉ bù phần còn thiếu
  const [quaXong, setQuaXong] = useState(false);
  const gia = y.gia ?? 0;
  const co = (y.so_du ?? 0) + them;
  // Quà chào mừng chỉ cách một cú bấm → gói gợi ý + số bạn cần mời tính phần thiếu SAU quà (không gợi nạp dư).
  const quaCho = quaXong ? 0 : y.chao_mung ?? 0;
  const thieu = Math.max(0, gia - co - quaCho);
  const hoi = y.nguon === "hoi";
  return (
    <div className="space-y-4">
      <ThanhVi co={co} can={gia} />
      {y.chao_mung ? <NhanChaoMung y={y} xong={xong} daNhan={(n) => { setThem(n); setQuaXong(true); }} /> : null}
      {/* Quà một chạm đã đủ giá → chỉ một nút, không bày thêm lối trả tiền / mời bạn. */}
      {quaCho > 0 && gia - co - quaCho <= 0 ? null : <>
      <p className="text-sm font-medium text-fg">{hoi ? `Mỗi câu ${gia} Sao — chọn một cách:` : "Chọn một cách để đọc tiếp:"}</p>
      <NapNhanh can={thieu} kind={y.can} nguon={y.nguon} giaCau={hoi ? gia : undefined}
        moiBan={<TheMoiBan nguon={y.nguon} gia={gia} thieu={thieu} kind={y.can} />} />
      </>}
    </div>
  );
}

function NhanChaoMung({ y, xong, daNhan: baoDaNhan }: { y: YeuCauSao; xong: () => void; daNhan: (n: number) => void }) {
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daNhan, setDaNhan] = useState<number | null>(null);
  const [tkCoHoSo, setTkCoHoSo] = useState<boolean | null>(null);
  const [loiKiem, setLoiKiem] = useState(false);
  const cc = useChuChung();
  const [lanKiem, setLanKiem] = useState(0);
  const hs = useHoSo() ?? null;
  // Đọc lỗi KHÔNG được coi là "chưa có hồ sơ" (sẽ ghi đè hồ sơ đang có trong tài khoản) → báo lỗi, cho thử lại.
  useEffect(() => {
    let huy = false;
    setLoiKiem(false);
    void (async () => {
      try {
        const uid = (await (await supabase())?.auth.getUser())?.data.user?.id;
        if (!uid) throw new Error("chua_dang_nhap");
        const co = Boolean(await hoSoTaiKhoan(uid));
        if (!huy) setTkCoHoSo(co);
      } catch { if (!huy) setLoiKiem(true); }
    })();
    return () => { huy = true; };
  }, [lanKiem]);
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
      setDaNhan(them); baoDaNhan(them); setDang(false);
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa lưu được."); setDang(false); }
  }
  if (daNhan !== null) {
    return <p className="rounded-2xl border border-jade/40 bg-jade/5 p-4 text-sm text-fg" data-testid="da-nhan-chao-mung">
      {daNhan ? `Đã nhận ${daNhan} Sao.` : "Quà chào mừng đã nhận trước đó."} Còn thiếu {Math.max(0, (y.gia ?? 0) - (y.so_du ?? 0) - daNhan)} Sao — chọn một cách bên dưới.</p>;
  }
  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4" data-testid="nhan-chao-mung">
      <p className="flex gap-2 text-sm text-fg"><Gift className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
        <span>{tkCoHoSo
          ? <>Quà chào mừng: <b className="text-gold">{y.chao_mung} Sao</b> cho tài khoản đã lưu hồ sơ{du ? " — đủ mở ngay." : "."}</>
          : <>Quà chào mừng: lưu hồ sơ <b>{hs?.ho_ten ?? "của bạn"}</b> vào tài khoản để nhận <b className="text-gold">{y.chao_mung} Sao</b>{du ? " — đủ mở ngay." : "."}</>}</span></p>
      {!tkCoHoSo && (
        <p className="mt-1 text-xs text-fg-faint">Bấm nút là bạn đồng ý lưu <b>họ tên (kèm tên thường gọi), ngày giờ sinh (kèm cách nhập lịch), giới tính, nơi sinh</b> vào tài khoản để dùng trên máy khác.
          Nội dung bài đọc và câu hỏi không được lưu. Xoá được bất cứ lúc nào ở trang Tài khoản.{" "}
          <Link href="/chinh-sach-rieng-tu#du-lieu" className="text-gold underline">Chính sách quyền riêng tư</Link></p>
      )}
      {loiKiem ? (
        <p className="mt-3 text-sm text-cinnabar" role="alert">Chưa kiểm tra được tài khoản.{" "}
          <button type="button" className="underline" onClick={() => setLanKiem((n) => n + 1)}>{cc("loi.thu_lai")}</button></p>
      ) : tkCoHoSo === null ? (
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
        Câu này dùng <b className="text-gold">{y.gia} Sao</b> · ví còn <b className="text-fg">{y.so_du} Sao</b>
        {y.gia && y.so_du ? ` (đủ ${soCau(y.so_du, y.gia)} câu)` : ""}.
        Máy lỗi không trả lời được thì Sao tự hoàn. Ngày mai bạn lại có {y.tran} câu miễn phí.
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

/** Ba lối mở (đã đăng nhập, ví thiếu): thẻ "Đọc ngay" = gói nhỏ nhất đủ phần còn thiếu (SAO-ND: gói "Khởi đầu" khi đang
 *  bán) + nút QR, các gói khác gập trong "Chọn gói khác"; thẻ "Miễn phí — mời bạn" (`moiBan`, nơi gọi đưa vào); thẻ hội
 *  viên năm khi công tắc bật. Chưa từng nạp + công tắc bật → một dòng "Lần nạp đầu tặng thêm X% Sao". Sau khi trả tiền,
 *  /nap-sao/ket-qua đưa về đây. */
export function NapNhanh({ can = 0, kind = "nap", nguon = "luan_giai", giaCau, moiBan }: {
  can?: number; kind?: string; nguon?: YeuCauSao["nguon"]; /** nguon = hoi: giá mỗi câu → "N câu hỏi" */ giaCau?: number; moiBan?: React.ReactNode;
}) {
  const [ds, setDs] = useState<Goi[] | null>(null);
  const [cong, setCong] = useState<string | null>(null);
  const [giaBaoCao, setGiaBaoCao] = useState(0);
  const [napDau, setNapDau] = useState<NapDau | null>(null);
  const [hoiVien, setHoiVien] = useState<HoiVien | null>(null);   // SAO-HV: thẻ hội viên năm khi công tắc bật
  const [chon, setChon] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghi("checkout_viewed", { kind: "nap_nhanh" });
    let huy = false;
    void (async () => {
      // Gửi kèm access token (nếu có) để máy chủ trả "tài khoản này đã từng nạp chưa" — chỉ của chính mình.
      const token = await supabase().then((sb) => sb?.auth.getSession()).then((s) => s?.data.session?.access_token).catch(() => undefined);
      const r = await fetch("/api/thanh-toan/goi", token ? { headers: { authorization: `Bearer ${token}` } } : undefined);
      const d = (await r.json()) as { goi: Goi[]; cong: string | null; gia_bao_cao?: number; nap_dau?: NapDau | null; hoi_vien?: unknown };
      if (huy) return;
      setDs(d.goi); setCong(d.cong); setGiaBaoCao(d.gia_bao_cao ?? 0); setNapDau(d.nap_dau ?? null); setHoiVien(docHoiVien(d.hoi_vien));
      setChon(goiGoiY(d.goi, can)?.ma ?? "");
    })().catch(() => { if (!huy) setDs([]); });
    return () => { huy = true; };
  }, [can]);

  async function nap() {
    setDang(true); setLoi(null);
    ghi("sao_prompt_answered", { kind, ket_qua: "nap", nguon });
    ghi("checkout_started", { ...thuocTinhNap(chon, napDau), nguon: "nap_nhanh" });
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
  if (!cong) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-fg-muted" data-testid="nap-chua-mo">Nạp Sao đang chuẩn bị mở — trong lúc chờ, mời bạn bè để nhận Sao.</p>
        {moiBan}
      </div>
    );
  }
  const g = ds.find((x) => x.ma === chon);
  const nd = hienNapDau(napDau) ? napDau : null;
  const bcG = g ? soBaoCao(g.sao, giaBaoCao) : 0;
  const tangG = g && nd ? saoTangLanDau(g.sao, nd.phan_tram) : 0;
  return (
    <div className="grid gap-3">
      <div className="space-y-3 rounded-2xl border border-gold/50 bg-gold/[0.06] p-4" data-testid="nap-nhanh">
        <p className="flex items-center gap-2 font-medium text-fg">
          <Zap className="size-4 text-gold" aria-hidden /> {nguon === "hoi" ? "Hỏi ngay" : "Đọc ngay"}
          <span className="ml-auto text-xs font-normal text-fg-muted">QR ngân hàng · vài giây</span>
        </p>
        {nd && (
          <p className="flex items-start gap-2 text-xs text-fg-muted" data-testid="nap-dau">
            <Gift className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />{dongNapDau(nd)}
          </p>
        )}
        {g && (
          <p className="text-sm text-fg-muted" data-testid="goi-chon">
            Gói <b className="text-fg">{g.sao} Sao</b>{tangG > 0 && <span className="text-gold"> +{tangG} tặng</span>}
            {nguon === "hoi" ? (giaCau && soCau(g.sao, giaCau) > 0 ? ` · ${soCau(g.sao, giaCau)} câu hỏi` : "") : bcG > 0 ? ` · ≈ ${bcG} báo cáo` : ""}
            {g.mo_ta ? <span className="block text-xs text-fg-faint">{g.mo_ta}</span> : null}
          </p>
        )}
        <Button className="w-full" onClick={() => void nap()} disabled={dang || !g} data-testid="nap-nhanh-nut">
          {dang ? <Loader2 className="animate-spin" aria-hidden /> : <QrCode aria-hidden />}
          {g ? `Quét QR nạp ${g.sao} Sao · ${vnd(g.gia_vnd)}` : "Chọn gói"}
        </Button>
        {ds.length > 1 && (
          <details className="group" data-testid="goi-khac">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-xs text-fg-muted hover:text-fg">
              Chọn gói khác ({ds.length} gói) <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-2 grid gap-2">
              {ds.map((x) => {
                const bc = soBaoCao(x.sao, giaBaoCao);
                const tang = nd ? saoTangLanDau(x.sao, nd.phan_tram) : 0;
                return (
                  <label key={x.ma} data-testid={`goi-nhanh-${x.ma}`} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${chon === x.ma ? "border-gold bg-gold/5" : "border-line/70 hover:border-gold/50"}`}>
                    <input type="radio" name="goi-nhanh" value={x.ma} checked={chon === x.ma} onChange={() => setChon(x.ma)} className="sr-only" />
                    <Sparkles className="size-4 text-gold" aria-hidden />
                    <span className="flex-1"><b className="text-fg">{x.sao} Sao</b>
                      {tang > 0 && <span className="text-xs text-gold"> +{tang} tặng</span>}
                      {bc > 0 && <span className="block text-xs text-fg-muted">≈ {bc} báo cáo</span>}
                      {x.mo_ta && <span className="block text-xs text-fg-faint">{x.mo_ta}</span>}
                    </span>
                    {x.nhan && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-bg">{x.nhan}</span>}
                    <span className="text-sm text-fg">{vnd(x.gia_vnd)}</span>
                  </label>
                );
              })}
            </div>
          </details>
        )}
        {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      </div>
      {moiBan}
      {hienDongHoiVien(hoiVien) && <TheHoiVien hv={hoiVien} kind={kind} nguon={nguon} />}
      <p className="text-xs text-fg-faint">Sao không đổi ra tiền · Sao mua không hết hạn · nạp xong bạn quay lại đúng trang này.</p>
    </div>
  );
}
