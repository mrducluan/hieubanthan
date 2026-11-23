"use client";
// TCS-1 — "Chia sẻ thẻ điểm" sau khi xem "Xem lá số 2 người": máy chủ chấm lại qua engine rồi ký mã (lib/ma-moi.ts
// kyMaHai — chỉ tên người gửi, quan hệ, điểm, mức, ≤ 3 tiêu chí; không ngày sinh). Link /the/hai/<mã>?tu=hp.<…> đo
// referral_signup như các thẻ khác; ảnh /og/hai (dọc 1080×1350) tải về để đăng story — ảnh có mã QR + hieuban.com.
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import { DongThuongMoi } from "@/components/chia-se/DongThuongMoi";
import { KhungTaoThe } from "@/components/chia-se/KhungTaoThe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";

export function NutChiaSeHai({ yeuCau, diem, muc }: { yeuCau: Record<string, unknown>; diem?: number | null; muc?: string | null }) {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  async function tao(tenBan: string) {
    const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/hai", { ...yeuCau, ten_ban: tenBan });
    const u = new URL(`/the/hai/${ma}`, window.location.origin);
    u.searchParams.set("tu", tu);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    return { ma, tu, link: u.toString() };
  }
  return (
    <KhungTaoThe moTestId="mo-chia-se-hai" nhanNut={CTA_CHIA_SE.hai.nhan} phuNut={CTA_CHIA_SE.hai.phu} nho
      tieuDe="Thẻ điểm hai người" idTen="hai-ten-ban" nhanTen="Tên bạn trên thẻ (không bắt buộc)" taoTestId="tao-the-hai" tao={tao}
      daGui={(t) => ghi("share_created", { kind: "hai_nguoi", ma_moi: t.tu, co_ma: Boolean(maCuaToi) })}
      ghiChu={<><span data-testid="hai-khong-ten-kia">Thẻ không ghi tên người kia.</span> Thẻ chỉ có tên bạn gõ, quan hệ, điểm và ba mặt nổi bật —
        không có ngày sinh, không có con số nào suy ra được tuổi. Hết hạn sau 90 ngày.</>}
      bangGui={(t) => ({
        kind: "hai_nguoi", tieuDe: "Xem lá số 2 người", testIdLink: "link-the-hai", testIdAnh: "tai-anh-the-hai",
        anh: `/og/hai?ma=${encodeURIComponent(t.ma)}`, anhDoc: `/og/hai?ma=${encodeURIComponent(t.ma)}&khung=doc`, tenTep: "diem-hai-nguoi.png",
        onLuuAnh: () => ghi("share_created", { kind: "hai_nguoi_anh", ma_moi: t.tu, co_ma: false /* ảnh: mã QR không mang ?gt= */ }),
        loiNhan: loiNhanThe("hai", { diem, nhan: muc }),
      })}>
      <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
    </KhungTaoThe>
  );
}
