"use client";
// CHANG-4 — nút chia sẻ ở kết quả /chiem-tinh (khâu MỜI). Máy chủ đọc lại cung qua engine rồi ký mã (lib/ma-moi.ts kyMaSao /
// kyMaSao2): thẻ "Bản đồ sao của tôi" chỉ có tên bạn gõ + cung Mặt Trời / Mặt Trăng / Mọc; thẻ "Hợp đôi chiêm tinh" chỉ có
// tên bạn gõ, cung Mặt Trời hai người, ≤ 3 chủ đề — KHÔNG ngày giờ / nơi sinh, không tên người kia, không điểm số.
// Ngày sinh chỉ gửi lên máy chủ trong lượt tạo thẻ (như lúc lập bản đồ), không vào link. Link /the/sao/<mã>?tu=st.<…>,
// /the/sao2/<mã>?tu=sd.<…> đo share_clicked → referral_signup như các thẻ khác; ảnh /og/sao, /og/sao2 có QR + hieuban.com.
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import { DongThuongMoi } from "@/components/chia-se/DongThuongMoi";
import { KhungTaoThe } from "@/components/chia-se/KhungTaoThe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";

type Nguoi = { ngay_sinh: string; gio_sinh: string | null; noi_sinh: string; vung_vn?: "north" | "south" };

function useTaoLink(duong: "sao" | "sao2") {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  return {
    nguoiDung,
    async tao(body: Record<string, unknown>, ten: string, hash = "") {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>(`/api/chia-se/${duong}`, { ...body, ten_hien_thi: ten });
      const u = new URL(`/the/${duong}/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      return { ma, tu, link: u.toString() + hash };
    },
  };
}

export function NutChiaSeBanDoSao({ nguoi, gioiTinh, matTroi, matTrang }: {
  nguoi: Nguoi; gioiTinh: "nam" | "nu"; matTroi?: string | null; matTrang?: string | null;
}) {
  const { nguoiDung, tao } = useTaoLink("sao");
  return (
    <KhungTaoThe moTestId="mo-chia-se-sao" nhanNut={CTA_CHIA_SE.ban_do_sao.nhan} phuNut={CTA_CHIA_SE.ban_do_sao.phu} nho
      tieuDe="Thẻ “Bản đồ sao của tôi”" idTen="sao-ten" nhanTen="Tên trên thẻ (không bắt buộc)" taoTestId="tao-the-sao"
      tao={(ten) => tao({ ...nguoi, gioi_tinh: gioiTinh }, ten)}
      daGui={(t) => ghi("share_created", { kind: "ban_do_sao", ma_moi: t.tu })}
      ghiChu="Thẻ chỉ có tên bạn gõ và ba cung: Mặt Trời, Mặt Trăng, cung Mọc — không ngày giờ sinh, không nơi sinh. Chưa có giờ sinh thì không có cung Mọc. Hết hạn sau 90 ngày."
      bangGui={(t) => ({
        kind: "ban_do_sao", tieuDe: "Bản đồ sao của tôi", testIdLink: "link-the-sao", testIdAnh: "tai-anh-the-sao",
        anh: `/og/sao?ma=${encodeURIComponent(t.ma)}`, anhDoc: `/og/sao?ma=${encodeURIComponent(t.ma)}&khung=doc`, tenTep: "ban-do-sao.png",
        onLuuAnh: () => ghi("share_created", { kind: "ban_do_sao_anh", ma_moi: t.tu }),
        loiNhan: loiNhanThe("ban_do_sao", { ten: matTroi, nhan: matTrang }),
      })}>
      <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
    </KhungTaoThe>
  );
}

export function NutChiaSeHopDoiSao({ nguoiA, nguoiB, chuDe }: { nguoiA: Nguoi; nguoiB: Nguoi; chuDe?: string | null }) {
  const { nguoiDung, tao } = useTaoLink("sao2");
  const bo = ({ vung_vn: _v, ...n }: Nguoi) => n;   // route hợp đôi không nhận vùng (engine tự tra theo nơi sinh)
  return (
    <KhungTaoThe moTestId="mo-chia-se-sao2" nhanNut={CTA_CHIA_SE.hop_doi_sao.nhan} phuNut={CTA_CHIA_SE.hop_doi_sao.phu} nho
      tieuDe="Thẻ “Hợp đôi chiêm tinh”" idTen="sao2-ten" nhanTen="Tên của bạn trên thẻ (không bắt buộc)" taoTestId="tao-the-sao2"
      tao={(ten) => tao({ nguoi_a: bo(nguoiA), nguoi_b: bo(nguoiB), dong_y_tu_nguyen: true }, ten, "#hop-doi")}
      daGui={(t) => ghi("share_created", { kind: "hop_doi_sao", ma_moi: t.tu })}
      ghiChu="Thẻ chỉ có tên bạn gõ, cung Mặt Trời của hai người và tối đa ba chủ đề hai bản đồ sao gặp nhau — không tên người kia, không ngày giờ hay nơi sinh của ai, không chấm điểm. Hết hạn sau 90 ngày."
      bangGui={(t) => ({
        kind: "hop_doi_sao", tieuDe: "Hai bản đồ sao", testIdLink: "link-the-sao2", testIdAnh: "tai-anh-the-sao2",
        anh: `/og/sao2?ma=${encodeURIComponent(t.ma)}`, anhDoc: `/og/sao2?ma=${encodeURIComponent(t.ma)}&khung=doc`, tenTep: "hai-ban-do-sao.png",
        onLuuAnh: () => ghi("share_created", { kind: "hop_doi_sao_anh", ma_moi: t.tu }),
        loiNhan: loiNhanThe("hop_doi_sao", { ten: chuDe }),
      })}>
      <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
    </KhungTaoThe>
  );
}
