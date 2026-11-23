"use client";
// SAO-HH — "Chia sẻ" trên huy hiệu đã đạt (khâu MỜI): link /the/huy-hieu/<mã>?tu=hh.<ngẫu nhiên> (+ ?gt= khi đã đăng nhập
// để bạn bè lưu hồ sơ thì cả hai nhận Sao mời) + ảnh /og/huy-hieu (dọc, QR + hieuban.com). Thẻ chỉ mang mã huy hiệu —
// không tên, không ngày đạt → không ký mã.
import { useState } from "react";
import { Share2 } from "lucide-react";
import { HopGui } from "@/components/chia-se/HopChiaSe";
import { DongThuongMoi } from "@/components/chia-se/DongThuongMoi";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { DANH_MUC, duongTheHuyHieu, THE_HUY_HIEU, type MaHuyHieu } from "@/lib/huy-hieu";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";

export const maMoiHuyHieu = () => `hh.${maNgauNhien(10)}`;

export function NutChiaSeHuyHieu({ ma }: { ma: MaHuyHieu }) {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  const [mo, setMo] = useState(false);
  const [gui, setGui] = useState<{ url: string; tu: string } | null>(null);

  function chiaSe() {
    setMo(true);
    const m = gui?.tu ?? maMoiHuyHieu();
    if (!gui) ghi("share_created", { kind: "huy_hieu", ma_moi: m, co_ma: Boolean(maCuaToi) });
    // Link dựng lại mỗi lần mở: mã mời ?gt= về muộn vẫn được gắn.
    const u = new URL(duongTheHuyHieu(ma), window.location.origin);
    u.searchParams.set("tu", m);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    setGui({ url: u.toString(), tu: m });
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={chiaSe} data-testid={`chia-se-hh-${ma}`}
        className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-gold hover:underline">
        <Share2 className="size-3.5" aria-hidden /> {CTA_CHIA_SE.huy_hieu.nhan}
      </button>
      <HopGui mo={mo} onMoChange={setMo} tieuDeHop={`Huy hiệu “${DANH_MUC[ma].ten}”`}
        gui={gui && {
          kind: "huy_hieu", url: gui.url, tu: gui.tu, tieuDe: `Huy hiệu “${DANH_MUC[ma].ten}”`,
          anh: `/og/huy-hieu?ma=${ma}&tu=${gui.tu}`, anhDoc: `/og/huy-hieu?ma=${ma}&tu=${gui.tu}&khung=doc`,
          tenTep: `huy-hieu-${ma.replace(/_/g, "-")}.png`, testIdAnh: `tai-anh-hh-${ma}`,
          onLuuAnh: () => ghi("share_created", { kind: "huy_hieu_anh", ma_moi: gui.tu, co_ma: false /* ảnh: QR không mang ?gt= */ }),
          loiNhan: loiNhanThe("huy_hieu", { ten: DANH_MUC[ma].ten, moi: THE_HUY_HIEU[ma].moi }),
        }}>
        <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
      </HopGui>
    </div>
  );
}
