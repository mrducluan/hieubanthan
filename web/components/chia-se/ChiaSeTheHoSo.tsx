"use client";
// BT-UI — chia sẻ NGAY TRÊN thẻ "Hồ sơ bản thân" (khâu MỜI): một chạm → máy chủ ký mã thẻ (chỉ tên hiển thị + con số,
// không ngày sinh — /api/chia-se/tao như trang /chia-se) → hiện mã QR để bạn bè quét tại chỗ + Gửi link / Chép / Tải ảnh
// (ảnh /og đã có QR + hieuban.com — TCS-1). Đổi tên hiển thị trên thẻ vẫn ở /chia-se.
import { useMemo, useState } from "react";
import Link from "@/components/khung/Lien";
import { Check, Copy, Download, QrCode, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChepTay, chepLink, guiHoacChep } from "@/components/chia-se/GuiLink";
import { hoTenList, tenGoi, type HoSo } from "@/lib/hoso";
import { postJson } from "@/lib/goi-api";
import { docQuyUocDD } from "@/lib/quy-uoc-dd";
import { ghi, maMoiTuToken } from "@/lib/do-luong";
import { useNguoiDung } from "@/lib/tai-khoan";
import { useMaCuaToi } from "@/lib/sao";
import { duongQr, maHoaQr, type MaQr } from "@/lib/qr";
import { GOC_QR } from "@/lib/the-chia-se";

export function ChiaSeTheHoSo({ hoSo, soDuongDoi }: { hoSo: HoSo; soDuongDoi?: number }) {
  const [da, setDa] = useState<{ ma: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const [chepTay, setChepTay] = useState(false);
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  const loiNhan = `Con số đường đời của ${tenGoi(hoSo)}${soDuongDoi ? ` là ${soDuongDoi}` : ""}. Còn bạn?`;

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

  function baoChep(kq: string) {
    setChepTay(kq === "khong_duoc");
    if (kq === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2000); }
  }

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma } = await postJson<{ ma: string }>("/api/chia-se/tao", {
        ten_hien_thi: tenGoi(hoSo), ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
        quy_uoc_duong_doi: docQuyUocDD(),
      });
      setDa({ ma });
      const link = linkThe(ma);
      ghi("share_created", { kind: "card", ma_moi: maMoiTuToken(ma), co_ma: Boolean(maCuaToi), nguon: "ban_than" });
      // Điện thoại: mở luôn hộp chia sẻ của máy; máy tính: khung QR + nút hiện ra là đủ (không tự chép).
      if (typeof navigator.share === "function") {
        try { await navigator.share({ title: "Hiểu Bản Thân", text: loiNhan, url: link }); } catch { /* huỷ / hết "cú bấm" → dùng nút bên dưới */ }
      }
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được link.");
    } finally {
      setDang(false);
    }
  }

  if (!da || !link) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2" data-testid="chia-se-the-ho-so">
        <p className="min-w-0 flex-1 text-xs text-fg-faint">Thẻ chỉ có tên và bốn con số — không có ngày sinh.</p>
        <Button size="sm" onClick={() => void tao()} disabled={dang} data-testid="nut-chia-se-the">
          <Share2 aria-hidden /> {dang ? "Đang tạo…" : "Chia sẻ thẻ"}
        </Button>
        {loi && <p role="alert" className="w-full text-sm text-cinnabar">{loi}</p>}
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
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void guiHoacChep({ title: "Hiểu Bản Thân", text: loiNhan, url: link }).then(baoChep)} data-testid="gui-the-ho-so">
              <Send aria-hidden /> Gửi link
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void chepLink(link).then(baoChep)} data-testid="chep-the-ho-so">
              {daChep ? <Check aria-hidden /> : <Copy aria-hidden />}{daChep ? "Đã chép" : "Chép link"}
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href={`/og?ma=${encodeURIComponent(da.ma)}&khung=doc`} download="the-hieu-ban-than.png" data-testid="tai-anh-the-ho-so"
                onClick={() => ghi("share_created", { kind: "card_anh", nguon: "ban_than" })}>
                <Download aria-hidden /> Tải ảnh
              </a>
            </Button>
          </div>
        </div>
      </div>
      {chepTay && <ChepTay url={link} />}
      <p className="text-xs text-fg-faint">
        Ảnh tải về có sẵn mã QR, hợp đăng story. <Link href="/chia-se" className="text-gold hover:underline">Đổi tên hiển thị trên thẻ</Link>
      </p>
    </div>
  );
}
