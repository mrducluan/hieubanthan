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

/** TV-LN — tên ngắn 5 phái lưu nguyệt (cách tính đầy đủ do engine trả về, hiện ở khung Lưu nguyệt). */
export const TEN_PHAI_LUU_NGUYET: Record<PhaiLuuNguyet, string> = {
  dau_quan_thai_tue: "Đẩu Quân từ Thái Tuế (phổ biến)",
  dau_quan_tieu_han: "Đẩu Quân từ Tiểu hạn",
  tieu_han: "Tháng Giêng tại Tiểu hạn",
  luu_nien: "Tháng Giêng tại cung lưu niên",
  dia_chi_thang: "Theo địa chi của tháng",
};

/** Tên rất ngắn cho chip khi khung đóng. */
const CHIP_LUU_NGUYET: Record<PhaiLuuNguyet, string> = {
  dau_quan_thai_tue: "Hạn tháng: Đẩu Quân",
  dau_quan_tieu_han: "Hạn tháng: Đẩu Quân · Tiểu hạn",
  tieu_han: "Hạn tháng: tại Tiểu hạn",
  luu_nien: "Hạn tháng: tại lưu niên",
  dia_chi_thang: "Hạn tháng: địa chi tháng",
};

type Viet = "viet" | "trung";
type TN = "thang_sau" | "thang_chinh";

export function TruongPhai(p: {
  lich: Viet; setLich: (v: Viet) => void; lichKhac: boolean;
  phaiDoSang: PhaiDoSang; setPhaiDoSang: (v: PhaiDoSang) => void;
  hoaLinh: Viet; setHoaLinh: (v: Viet) => void;
  thangNhuan: TN; setThangNhuan: (v: TN) => void; coNhuan: boolean;
  luuNguyet: PhaiLuuNguyet; setLuuNguyet: (v: PhaiLuuNguyet) => void;
  /** Giữ trạng thái mở ở trang cha: lá số tạm biến mất mỗi lần engine an lại → khung không tự đóng khi vừa bấm. */
  mo?: boolean; doiMo?: (v: boolean) => void;
}) {
  const dangDung: PhaiDangDung[] = [
    { nhan: p.lich === "viet" ? "Lịch Việt" : "Lịch Trung Quốc", khac: p.lich !== "viet" },
    { nhan: p.phaiDoSang === "nam" ? "Độ sáng Nam phái" : "Độ sáng phái Trung", khac: p.phaiDoSang !== "nam" },
    { nhan: p.hoaLinh === "viet" ? "Hoả Linh lối Việt" : "Hoả Linh Trung Châu", khac: p.hoaLinh !== "viet" },
    { nhan: CHIP_LUU_NGUYET[p.luuNguyet], khac: p.luuNguyet !== "dau_quan_thai_tue" },
    ...(p.coNhuan ? [{ nhan: p.thangNhuan === "thang_sau" ? "Nhuận: tính tháng sau" : "Nhuận: như tháng chính", khac: p.thangNhuan !== "thang_sau" }] : []),
  ];
  const daDoi = dangDung.some((d) => d.khac);
  const nhac = [
    p.lichKhac && "Ngày sinh của bạn lệch giữa lịch Việt và lịch Trung Quốc — đổi lịch sẽ ra lá số khác.",
    p.coNhuan && "Bạn sinh nửa sau tháng nhuận — mỗi phái tính một kiểu, Mệnh và Cục có thể khác.",
  ].filter(Boolean).join(" ");

  const veMacDinh = () => {
    if (p.lich !== "viet") p.setLich("viet");
    if (p.phaiDoSang !== "nam") p.setPhaiDoSang("nam");
    if (p.hoaLinh !== "viet") p.setHoaLinh("viet");
    if (p.luuNguyet !== "dau_quan_thai_tue") p.setLuuNguyet("dau_quan_thai_tue");
    if (p.thangNhuan !== "thang_sau") p.setThangNhuan("thang_sau");
  };

  return (
    <KhungPhai testId="truong-phai" mo={p.mo} doiMo={p.doiMo}
      tomTat={<ChipPhai ds={dangDung} />}
      nhac={nhac || undefined}
      moTa={<>Mỗi phái theo một nguồn sách — có lá số đổi phái gần như y nguyên, có lá khác hẳn. Mặc định theo{" "}
        <b className="text-fg">lối Việt</b>; hỏi đáp và luận giải bên dưới đi theo đúng lựa chọn đang xem.</>}>
      <DongPhai ten="Âm lịch" nhan="Âm lịch dùng để lập lá số" giaTri={p.lich} doi={p.setLich}
        luaChon={[["viet", "Lịch Việt Nam"], ["trung", "Lịch Trung Quốc"]]}
        noiBat={p.lichKhac} nhanNoiBat="Đổi là ra lá khác"
        goiY={p.lichKhac
          ? "Ngày sinh của bạn rơi vào đợt lịch Việt (UTC+7) và lịch Trung Quốc (UTC+8) lệch nhau — đổi lịch sẽ ra ngày/tháng âm khác, nên Mệnh, Cục và lời luận có thể khác."
          : "Ngày sinh của bạn hai lịch trùng nhau — đổi lịch không làm lá số thay đổi. (Sổ tử vi, phần mềm Trung Quốc đổi âm theo lịch Trung Quốc.)"} />
      <DongPhai ten="Độ sáng & tên sao" nhan="Bảng độ sáng sao" giaTri={p.phaiDoSang} doi={p.setPhaiDoSang}
        luaChon={[["nam", "Nam phái"], ["trung", "Phái Trung"]]}
        goiY="Bảng miếu/vượng/đắc/hãm và tên vòng Thái Tuế (Việt: Thái Tuế, Thiếu Dương, Tử Phù…; Trung: Tuế Kiện, Hối Khí, Tiểu Hao…). Vị trí sao không đổi." />
      <DongPhai ten="Hoả Tinh, Linh Tinh" nhan="Cách an Hoả Tinh, Linh Tinh" giaTri={p.hoaLinh} doi={p.setHoaLinh}
        luaChon={[["viet", "Lối Việt"], ["trung", "Trung Châu"]]}
        goiY="Sách Việt đổi chiều an theo âm dương nam nữ; phái Trung Châu an cố định — có thể đổi cả cách cục (vd Hoả Tham ↔ Linh Tham)." />
      <DongKhung ten="Hạn tháng (lưu nguyệt)"
        goiY="Các phái khác nhau ở cung khởi tháng Giêng — cùng một tháng có thể rơi vào cung khác. Lá số gốc không đổi; chỉ đổi cung của từng tháng ở khung Lưu nguyệt và câu trả lời về tháng.">
        <select aria-label="Phái tính lưu nguyệt" value={p.luuNguyet} onChange={(e) => p.setLuuNguyet(e.target.value as PhaiLuuNguyet)}
          className="h-10 w-full rounded-full border border-line bg-surface/60 px-3 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-auto">
          {(Object.keys(TEN_PHAI_LUU_NGUYET) as PhaiLuuNguyet[]).map((k) => <option key={k} value={k}>{TEN_PHAI_LUU_NGUYET[k]}</option>)}
        </select>
      </DongKhung>
      {p.coNhuan && (
        <DongPhai testId="chon-thang-nhuan" ten="Tháng nhuận" nhan="Cách tính tháng nhuận" giaTri={p.thangNhuan} doi={p.setThangNhuan}
          luaChon={[["thang_sau", "Tính sang tháng sau"], ["thang_chinh", "Như tháng chính"]]}
          noiBat nhanNoiBat="Áp dụng với bạn"
          goiY="Bạn sinh nửa sau tháng nhuận — có phái tính sang tháng sau, có phái tính như tháng chính. Mệnh, Cục và các sao có thể khác." />
      )}
      {daDoi && (
        <div className="border-t border-line/50 pt-3">
          <button type="button" onClick={veMacDinh} data-testid="phai-ve-mac-dinh"
            className="inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted hover:text-gold">
            <RotateCcw className="size-3.5" aria-hidden /> Về mặc định lối Việt
          </button>
        </div>
      )}
    </KhungPhai>
  );
}
