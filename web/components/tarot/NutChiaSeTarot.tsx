"use client";
// TR-3 — "Chia sẻ câu trả lời" dưới bài đọc Tarot: máy chủ đọc lại trải bài qua engine (/v1/tarot/the) rồi ký mã
// (lib/ma-moi.ts kyMaTarot — chỉ tên hiển thị, lá đã rút + vị trí, nghiêng, nhãn loại việc theo danh mục; KHÔNG câu hỏi bạn gõ,
// KHÔNG ngày sinh, KHÔNG lời đọc từng lá). Link /the/tarot/<mã>?tu=ta.<…> đo referral_signup như các thẻ khác; ảnh /og/tarot có QR.
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import { KhungTaoThe } from "@/components/chia-se/KhungTaoThe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import type { LaRut, MaTraiBai } from "@/lib/tarot-chung";

export function NutChiaSeTarot({ traiBai, la, yDinh, viec, linhVuc, nhanNghieng, nhanViec }: {
  traiBai: MaTraiBai; la: LaRut[]; yDinh: string; viec: string | null; linhVuc: string | null;
  nhanNghieng?: string | null; nhanViec?: string | null;
}) {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  async function tao(ten: string) {
    const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/tarot",
      { trai_bai: traiBai, la, y_dinh: yDinh, viec, linh_vuc: linhVuc, ten_hien_thi: ten });
    const u = new URL(`/the/tarot/${ma}`, window.location.origin);
    u.searchParams.set("tu", tu);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    return { ma, tu, link: u.toString() };
  }
  return (
    <KhungTaoThe moTestId="mo-chia-se-tarot" nhanNut={CTA_CHIA_SE.tarot.nhan} phuNut={CTA_CHIA_SE.tarot.phu}
      tieuDe="Thẻ “Câu trả lời của lá bài”" idTen="tarot-ten" nhanTen="Tên trên thẻ (không bắt buộc)" taoTestId="tao-the-tarot" tao={tao}
      daGui={(t) => ghi("share_created", { kind: "tarot", ma_moi: t.tu })}
      ghiChu="Thẻ chỉ có tên bạn gõ, các lá đã rút, chiều nghiêng và loại việc — không có câu bạn hỏi, không ngày sinh. Hết hạn sau 90 ngày."
      bangGui={(t) => ({
        kind: "tarot", tieuDe: "Lá bài trả lời", testIdLink: "link-the-tarot", testIdAnh: "tai-anh-the-tarot",
        anh: `/og/tarot?ma=${encodeURIComponent(t.ma)}`, anhDoc: `/og/tarot?ma=${encodeURIComponent(t.ma)}&khung=doc`, tenTep: "la-bai-tra-loi.png",
        onLuuAnh: () => ghi("share_created", { kind: "tarot_anh", ma_moi: t.tu }),
        loiNhan: loiNhanThe("tarot", { nhan: nhanNghieng, viec: nhanViec }),
      })} />
  );
}
