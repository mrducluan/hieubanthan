"use client";
// SAO-HH — "Chia sẻ" trên huy hiệu đã đạt (khâu MỜI): link /the/huy-hieu/<mã>?tu=hh.<ngẫu nhiên> (+ ?gt= khi đã đăng nhập
// để bạn bè lưu hồ sơ thì cả hai nhận Sao mời) + ảnh /og/huy-hieu (dọc, QR + hieuban.com). Thẻ chỉ mang mã huy hiệu —
// không tên, không ngày đạt → không ký mã.
import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { ChepTay, guiHoacChep } from "@/components/chia-se/GuiLink";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { DANH_MUC, duongTheHuyHieu, THE_HUY_HIEU, type MaHuyHieu } from "@/lib/huy-hieu";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";

export const maMoiHuyHieu = () => `hh.${maNgauNhien(10)}`;

export function NutChiaSeHuyHieu({ ma }: { ma: MaHuyHieu }) {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  const [tu, setTu] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const [chepTay, setChepTay] = useState<string | null>(null);

  async function chiaSe() {
    setChepTay(null);
    const m = maMoiHuyHieu();
    setTu(m);
    ghi("share_created", { kind: "huy_hieu", ma_moi: m, co_ma: Boolean(maCuaToi) });
    const u = new URL(duongTheHuyHieu(ma), window.location.origin);
    u.searchParams.set("tu", m);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    const url = u.toString();
    const chu = `Mình vừa có huy hiệu “${DANH_MUC[ma].ten}” trên Hiểu Bản Thân. ${THE_HUY_HIEU[ma].moi}`;
    const kq = await guiHoacChep({ title: `Huy hiệu “${DANH_MUC[ma].ten}”`, text: chu, url }, `${chu} ${url}`);
    if (kq === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2500); }
    else if (kq === "khong_duoc") setChepTay(url);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={() => void chiaSe()} data-testid={`chia-se-hh-${ma}`}
        className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-gold hover:underline">
        {daChep ? <Check className="size-3.5" aria-hidden /> : <Share2 className="size-3.5" aria-hidden />}
        {daChep ? "Đã chép link" : "Chia sẻ"}
      </button>
      {tu && (
        <a href={`/og/huy-hieu?ma=${ma}&tu=${tu}&khung=doc`} download={`huy-hieu-${ma.replace(/_/g, "-")}.png`}
          onClick={() => ghi("share_created", { kind: "huy_hieu_anh", ma_moi: tu, co_ma: false /* ảnh: QR không mang ?gt= */ })}
          className="inline-flex min-h-8 items-center gap-1 text-xs text-fg-muted hover:text-fg" data-testid={`tai-anh-hh-${ma}`}>
          <Download className="size-3.5" aria-hidden /> Tải ảnh
        </a>
      )}
      {chepTay && <ChepTay url={chepTay} className="w-full" />}
    </div>
  );
}
