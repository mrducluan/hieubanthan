"use client";
// BT-UI — chia sẻ NGAY TRÊN thẻ "Hồ sơ bản thân" (khâu MỜI): một chạm → máy chủ ký mã thẻ (chỉ tên hiển thị + con số,
// không ngày sinh — /api/chia-se/tao như trang /chia-se) → hiện mã QR để bạn bè quét tại chỗ + Gửi link / Chép / Tải ảnh
// (ảnh /og đã có QR + hieuban.com — TCS-1). Đổi tên hiển thị trên thẻ vẫn ở /chia-se.
import { useMemo, useState } from "react";
import Link from "@/components/khung/Lien";
import { Layers, QrCode, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HopGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import { hoTenList, tenGoi, type HoSo } from "@/lib/hoso";
import { postJson } from "@/lib/goi-api";
import { docQuyUocDD } from "@/lib/quy-uoc-dd";
import { ghi, maMoiTuToken } from "@/lib/do-luong";
import { useNguoiDung } from "@/lib/tai-khoan";
import { useMaCuaToi } from "@/lib/sao";
import { duongQr, maHoaQr, type MaQr } from "@/lib/qr";
import { GOC_QR } from "@/lib/the-chia-se";

/** `onMatSau`: mở "mặt sau" của thẻ — thẻ 5 mảnh ghép (Tử vi, Bát tự, Phong thuỷ… cùng một người), khung tạo thẻ nằm dưới hai cột. */
export function ChiaSeTheHoSo({ hoSo, soDuongDoi, onMatSau, matSauMo = false }: { hoSo: HoSo; soDuongDoi?: number; onMatSau?: () => void; matSauMo?: boolean }) {
  const [da, setDa] = useState<{ ma: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [mo, setMo] = useState(false);
  const [so, setSo] = useState<{ dd: number | null; k: string | null }>({ dd: soDuongDoi ?? null, k: null });
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  // Link dựng lúc DÙNG (không nhớ sẵn): mã mời ?gt= về muộn sau lần bấm đầu vẫn được gắn — bạn tạo tài khoản → cả hai nhận Sao.
  const linkThe = (ma: string) => {
    const u = new URL(`/the/${ma}`, window.location.origin);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    return u.toString();
  };
  const link = da ? linkThe(da.ma) : null;
  // Link thẻ dài quá sức chứa QR (phiên bản 10) → QR về trang chủ; link gửi / chép vẫn là link thẻ.
  const qr = useMemo<MaQr | null>(() => {
    if (!link) return null;
    try { return maHoaQr(link); } catch { try { return maHoaQr(`${GOC_QR}/`); } catch { return null; } }
  }, [link]);

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma, duong_doi, tu_khoa } = await postJson<{ ma: string; duong_doi?: number | null; tu_khoa?: string | null }>("/api/chia-se/tao", {
        ten_hien_thi: tenGoi(hoSo), ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
        quy_uoc_duong_doi: docQuyUocDD(),
      });
      setDa({ ma });
      setSo({ dd: duong_doi ?? soDuongDoi ?? null, k: tu_khoa ?? null });
      ghi("share_created", { kind: "card", ma_moi: maMoiTuToken(ma), co_ma: Boolean(maCuaToi), nguon: "ban_than" });
      setMo(true);   // HCS-1: mở hộp chia sẻ chung (ảnh xem trước, lời nhắn, Zalo / Messenger / Facebook)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được link.");
    } finally {
      setDang(false);
    }
  }

  // Thẻ hai mặt: mặt này là bốn con số; mặt sau là "5 mảnh ghép" (mỗi môn một mảnh) — cùng một người, hai cách khoe.
  const matSau = onMatSau && (
    <button type="button" onClick={() => { ghi("chart_interacted", { kind: "the_mat_sau" }); onMatSau(); }} aria-expanded={matSauMo} data-testid="the-mat-sau"
      className="vung-cham inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-moon/40 px-3 py-2 text-sm text-moon transition-colors hover:border-moon hover:text-fg">
      <Layers className="size-4" aria-hidden /> {matSauMo ? "Thẻ 5 mảnh ghép đang mở bên dưới" : "Mặt sau: thẻ 5 mảnh ghép làm nên tôi"}
    </button>
  );
  if (!da || !link) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2" data-testid="chia-se-the-ho-so">
        <p className="min-w-0 flex-1 text-xs text-fg-faint">Thẻ chỉ có tên và bốn con số — không có ngày sinh.</p>
        <NutRuBan nhan={dang ? "Đang tạo…" : CTA_CHIA_SE.card.nhan} nho dang={dang} onClick={() => void tao()} testId="nut-chia-se-the" />
        {loi && <p role="alert" className="w-full text-sm text-cinnabar">{loi}</p>}
        {matSau}
      </div>
    );
  }

  const n = qr ? qr.kichThuoc + 8 : 0;
  return (
    <div className="space-y-3" data-testid="chia-se-the-ho-so" data-da-tao="1">
      <div className="flex items-center gap-4">
        {qr && (
          <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label="Mã QR mở thẻ hồ sơ của bạn"
            className="size-28 shrink-0 rounded-lg" data-testid="qr-the-ho-so">
            <rect width={n} height={n} fill="#f4efe2" />
            <path d={duongQr(qr, 4)} fill="#0a0a17" />
          </svg>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="flex items-center gap-1.5 text-sm text-fg"><QrCode className="size-4 shrink-0 text-gold" aria-hidden /> Đưa bạn bè quét để xem thẻ</p>
          <p className="text-xs text-fg-muted">Bạn ấy thấy bốn con số của bạn và tự xem số của mình. Link hết hạn sau 90 ngày.</p>
          <Button size="sm" onClick={() => setMo(true)} data-testid="gui-the-ho-so"><Send aria-hidden /> Gửi cho bạn bè</Button>
        </div>
      </div>
      <HopGui mo={mo} onMoChange={setMo} tieuDeHop="Gửi thẻ của bạn"
        gui={{
          kind: "card", url: link, tu: maMoiTuToken(da.ma), tieuDe: "Hiểu Bản Thân",
          anh: `/og?ma=${encodeURIComponent(da.ma)}`, anhDoc: `/og?ma=${encodeURIComponent(da.ma)}&khung=doc`,
          tenTep: "the-hieu-ban-than.png", testIdAnh: "tai-anh-the-ho-so", testIdLink: "link-the-ho-so",
          onLuuAnh: () => ghi("share_created", { kind: "card_anh", nguon: "ban_than" }),
          loiNhan: loiNhanThe("card", { so: so.dd, tuKhoa: so.k }),
        }} />
      {matSau}
      <p className="text-xs text-fg-faint">
        Ảnh tải về có sẵn mã QR, hợp đăng story. <Link href="/chia-se" className="text-gold hover:underline">Đổi tên hiển thị trên thẻ</Link>
      </p>
    </div>
  );
}
