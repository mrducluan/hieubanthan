"use client";
// UI-PT2 P7 — "Chia sẻ thẻ nhà" dưới bài đọc "Nhà của bạn": máy chủ đọc lại qua engine rồi ký mã (lib/ma-moi.ts kyMaNha —
// chỉ tên hiển thị, hướng 8, loại nhà, mức và ≤ 6 phòng; KHÔNG địa chỉ / toạ độ / độ la bàn / năm xây / năm sinh).
// Link /the/nha/<mã>?tu=nh.<…> đo referral_signup như các thẻ khác; ảnh /og/nha (dọc) có mã QR + hieuban.com.
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import { DongThuongMoi } from "@/components/chia-se/DongThuongMoi";
import { KhungTaoThe } from "@/components/chia-se/KhungTaoThe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";

export function NutChiaSeNha({ yeuCau, loaiNha, huong }: { yeuCau: Record<string, unknown>; loaiNha?: string | null; huong?: string | null }) {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  async function tao(ten: string) {
    const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/nha", { ...yeuCau, ten_hien_thi: ten, ...(loaiNha ? { loai_nha_the: loaiNha } : {}) });
    const u = new URL(`/the/nha/${ma}`, window.location.origin);
    u.searchParams.set("tu", tu);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    return { ma, tu, link: u.toString() };
  }
  return (
    <KhungTaoThe moTestId="mo-chia-se-nha" nhanNut={CTA_CHIA_SE.nha.nhan} phuNut={CTA_CHIA_SE.nha.phu} nho
      tieuDe="Thẻ “Nhà của bạn”" idTen="nha-ten" nhanTen="Tên trên thẻ (không bắt buộc)" taoTestId="tao-the-nha" tao={tao}
      daGui={(t) => ghi("share_created", { kind: "nha", ma_moi: t.tu })}
      ghiChu="Thẻ chỉ có tên bạn gõ, hướng nhà (một trong 8 hướng), loại nhà, mức từng phòng — không địa chỉ, không toạ độ, không năm sinh, không năm xây. Hết hạn sau 90 ngày."
      bangGui={(t) => ({
        kind: "nha", tieuDe: "Nhà của bạn", testIdLink: "link-the-nha", testIdAnh: "tai-anh-the-nha",
        anh: `/og/nha?ma=${encodeURIComponent(t.ma)}`, anhDoc: `/og/nha?ma=${encodeURIComponent(t.ma)}&khung=doc`, tenTep: "nha-cua-ban.png",
        onLuuAnh: () => ghi("share_created", { kind: "nha_anh", ma_moi: t.tu }),
        loiNhan: loiNhanThe("nha", { ten: huong }),
      })}>
      <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
    </KhungTaoThe>
  );
}
