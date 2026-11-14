"use client";
// TV-PHAI + TV-LICH — khung "Trường phái" của trang Tử vi (chủ dự án chốt 2026-10-02: "hiện cả hai").
// Mỗi lựa chọn theo một nguồn tri thức; có lá số ra gần giống nhau, có lá khác hẳn. Web chỉ gửi lựa chọn —
// engine an lại lá số và luận theo đúng lựa chọn đó (cả hỏi đáp, luận giải).
// TP-GON (2026-10-28): dựng trên KhungPhai thu gọn — đóng chỉ còn chip các phái đang dùng + câu nhắc khi đổi phái
// làm khác lá số của chính người xem (lịch lệch, sinh nửa sau tháng nhuận).
import { RotateCcw } from "lucide-react";
import { ChipPhai, DongKhung, DongPhai, KhungPhai, type PhaiDangDung } from "@/components/huyen-hoc/KhungPhai";
import type { PhaiDoSang } from "@/components/huyen-hoc/LaSoTuVi";
import type { PhaiLuuNguyet } from "@/app/api/tuvi/schema";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";

/** TV-LN — 5 phái lưu nguyệt (tên: khoá `ln.<mã>` / `chip_ln.<mã>` ở lib/chu/tu-vi.ts; cách tính đầy đủ do engine trả). */
const PHAI_LN: PhaiLuuNguyet[] = ["dau_quan_thai_tue", "dau_quan_tieu_han", "tieu_han", "luu_nien", "dia_chi_thang"];

type Viet = "viet" | "trung";
/** HTT-1 — giờ sinh: đồng hồ (mặc định, như phần lớn sách Việt) hay giờ mặt trời thực tại kinh độ nơi sinh. */
export type GioSinh = "dong_ho" | "mat_troi";
/** TV-NHUAN3 — cách tính tháng nhuận (engine `tuvi_an_sao.THANG_NHUAN`). */
export type ThangNhuan = "thang_sau" | "thang_chinh" | "ca_thang_sau";
type TN = ThangNhuan;
export function TruongPhai(p: {
  lich: Viet; setLich: (v: Viet) => void; lichKhac: boolean;
  phaiDoSang: PhaiDoSang; setPhaiDoSang: (v: PhaiDoSang) => void;
  hoaLinh: Viet; setHoaLinh: (v: Viet) => void;
  /** HTT-1: giờ sinh theo đồng hồ / mặt trời thực; `coKinhDo` = nơi sinh có kinh độ (tỉnh Việt Nam hoặc thành phố trong danh sách). */
  gioSinh?: GioSinh; setGioSinh?: (v: GioSinh) => void; coKinhDo?: boolean;
  thangNhuan: TN; setThangNhuan: (v: TN) => void; coNhuan: boolean;
  luuNguyet: PhaiLuuNguyet; setLuuNguyet: (v: PhaiLuuNguyet) => void;
  /** Giữ trạng thái mở ở trang cha: lá số tạm biến mất mỗi lần engine an lại → khung không tự đóng khi vừa bấm. */
  mo?: boolean; doiMo?: (v: boolean) => void;
}) {
  const { c } = useChuTuVi();
  const dangDung: PhaiDangDung[] = [
    { nhan: p.lich === "viet" ? c("phai.lich_viet") : c("phai.lich_trung"), khac: p.lich !== "viet" },
    { nhan: p.phaiDoSang === "nam" ? c("phai.ds_nam") : c("phai.ds_trung"), khac: p.phaiDoSang !== "nam" },
    { nhan: p.hoaLinh === "viet" ? c("phai.hl_viet") : c("phai.hl_trung"), khac: p.hoaLinh !== "viet" },
    ...(p.setGioSinh ? [{ nhan: p.gioSinh === "mat_troi" ? c("phai.gio_mt") : c("phai.gio_dh"), khac: p.gioSinh === "mat_troi" }] : []),
    { nhan: c(`chip_ln.${p.luuNguyet}`), khac: p.luuNguyet !== "dau_quan_thai_tue" },
    ...(p.coNhuan ? [{ nhan: c(`chip_nhuan.${p.thangNhuan}`), khac: p.thangNhuan !== "thang_sau" }] : []),
  ];
  const daDoi = dangDung.some((d) => d.khac);
  const nhac = [
    p.lichKhac && c("nhac.lich_khac"),
    p.coNhuan && c("nhac.nhuan"),
  ].filter(Boolean).join(" ");

  const veMacDinh = () => {
    if (p.lich !== "viet") p.setLich("viet");
    if (p.phaiDoSang !== "nam") p.setPhaiDoSang("nam");
    if (p.hoaLinh !== "viet") p.setHoaLinh("viet");
    if (p.gioSinh === "mat_troi") p.setGioSinh?.("dong_ho");
    if (p.luuNguyet !== "dau_quan_thai_tue") p.setLuuNguyet("dau_quan_thai_tue");
    if (p.thangNhuan !== "thang_sau") p.setThangNhuan("thang_sau");
  };

  return (
    <KhungPhai testId="truong-phai" mo={p.mo} doiMo={p.doiMo}
      tomTat={<ChipPhai ds={dangDung} />}
      nhac={nhac || undefined}
      moTa={<>{c("phai.mo_ta_1")}{" "}
        <b className="text-fg">{c("phai.mo_ta_2")}</b>{c("phai.mo_ta_3")}</>}>
      <DongPhai ten={c("phai.am_lich")} nhan={c("phai.am_lich_nhan")} giaTri={p.lich} doi={p.setLich}
        luaChon={[["viet", c("phai.lich_vn")], ["trung", c("phai.lich_tq")]]}
        noiBat={p.lichKhac} nhanNoiBat={c("phai.doi_khac")}
        goiY={p.lichKhac ? c("phai.lich_goi_y_khac") : c("phai.lich_goi_y_trung")} />
      <DongPhai ten={c("phai.ds")} nhan={c("phai.ds_nhan")} giaTri={p.phaiDoSang} doi={p.setPhaiDoSang}
        luaChon={[["nam", c("phai.nam_phai")], ["trung", c("phai.phai_trung")]]}
        goiY={c("phai.ds_goi_y")} />
      <DongPhai ten={c("phai.hl")} nhan={c("phai.hl_nhan")} giaTri={p.hoaLinh} doi={p.setHoaLinh}
        luaChon={[["viet", c("phai.loi_viet")], ["trung", c("phai.trung_chau")]]}
        goiY={c("phai.hl_goi_y")} />
      {p.setGioSinh && (
        <DongPhai testId="chon-gio-sinh" ten={c("phai.gio")} nhan={c("phai.gio_nhan")} giaTri={p.gioSinh ?? "dong_ho"} doi={p.setGioSinh}
          luaChon={[["dong_ho", c("phai.theo_dong_ho")], ["mat_troi", c("phai.theo_mat_troi")]]}
          goiY={p.coKinhDo ? c("phai.gio_goi_y_co") : c("phai.gio_goi_y_khong")} />
      )}
      <DongKhung ten={c("phai.ln")}
        goiY={c("phai.ln_goi_y")}>
        <select aria-label={c("phai.ln_nhan")} value={p.luuNguyet} onChange={(e) => p.setLuuNguyet(e.target.value as PhaiLuuNguyet)}
          className="h-10 w-full rounded-full border border-line bg-surface/60 px-3 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-auto">
          {PHAI_LN.map((k) => <option key={k} value={k}>{c(`ln.${k}`)}</option>)}
        </select>
      </DongKhung>
      {p.coNhuan && (
        <DongPhai testId="chon-thang-nhuan" ten={c("phai.nhuan")} nhan={c("phai.nhuan_nhan")} giaTri={p.thangNhuan} doi={p.setThangNhuan}
          luaChon={[["thang_sau", c("phai.nhuan_sau")], ["thang_chinh", c("phai.nhuan_chinh")], ["ca_thang_sau", c("phai.nhuan_ca")]]}
          noiBat nhanNoiBat={c("phai.ap_dung")}
          goiY={c("phai.nhuan_goi_y")} />
      )}
      {daDoi && (
        <div className="border-t border-line/50 pt-3">
          <button type="button" onClick={veMacDinh} data-testid="phai-ve-mac-dinh"
            className="inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted hover:text-gold">
            <RotateCcw className="size-3.5" aria-hidden /> {c("phai.ve_mac_dinh")}
          </button>
        </div>
      )}
    </KhungPhai>
  );
}
