"use client";
// UI-KD 6 — "Chia sẻ quẻ" dưới kết quả: máy chủ đọc lại quẻ qua engine (6 giá trị hào, gieo tay) rồi ký mã (lib/ma-moi.ts
// kyMaQue — chỉ tên hiển thị, 6 giá trị, tên quẻ bản / biến, tên chủ đề; KHÔNG câu hỏi, KHÔNG giờ gieo, KHÔNG lời đọc).
// Link /the/que/<mã>?tu=qu.<…> đo referral_signup như các thẻ khác; ảnh /og/que (dọc) có mã QR + hieuban.com.
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import { KhungTaoThe } from "@/components/chia-se/KhungTaoThe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import type { GiaTriHao } from "@/lib/dong-xu";

export function NutChiaSeQue({ giaTri, chuDe, tenChuDe, tenQue, idSuffix = "" }: {
  giaTri: GiaTriHao[]; chuDe?: string | null; tenChuDe?: string | null; tenQue?: string | null; idSuffix?: string;
}) {
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  async function tao(ten: string) {
    const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/que",
      { gia_tri_hao: giaTri, ...(chuDe ? { chu_de: chuDe } : {}), ten_hien_thi: ten });
    const u = new URL(`/the/que/${ma}`, window.location.origin);
    u.searchParams.set("tu", tu);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    return { ma, tu, link: u.toString() };
  }
  return (
    <KhungTaoThe moTestId="mo-chia-se-que" nhanNut={CTA_CHIA_SE.que.nhan} phuNut={CTA_CHIA_SE.que.phu} nho
      tieuDe="Thẻ “Quẻ của tôi”" idTen={`que-ten${idSuffix}`} nhanTen="Tên trên thẻ (không bắt buộc)" taoTestId="tao-the-que" tao={tao}
      daGui={(t) => ghi("share_created", { kind: "que", ma_moi: t.tu })}
      ghiChu="Thẻ chỉ có tên bạn gõ, sáu hào đã gieo, tên quẻ và chủ đề — không có câu bạn hỏi, không giờ gieo, không lời đọc. Hết hạn sau 90 ngày."
      bangGui={(t) => ({
        kind: "que", tieuDe: "Quẻ của tôi", testIdLink: "link-the-que", testIdAnh: "tai-anh-the-que",
        anh: `/og/que?ma=${encodeURIComponent(t.ma)}`, anhDoc: `/og/que?ma=${encodeURIComponent(t.ma)}&khung=doc`, tenTep: "que-cua-toi.png",
        onLuuAnh: () => ghi("share_created", { kind: "que_anh", ma_moi: t.tu }),
        loiNhan: loiNhanThe("que", { ten: tenQue, viec: tenChuDe }),
      })} />
  );
}
