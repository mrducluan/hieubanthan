"use client";
// TV-PHAI + TV-LICH — khung "Trường phái" của trang Tử vi (chủ dự án chốt 2026-10-02: "hiện cả hai").
// Mỗi lựa chọn theo một nguồn tri thức; có lá số ra gần giống nhau, có lá khác hẳn. Web chỉ gửi lựa chọn —
// engine an lại lá số và luận theo đúng lựa chọn đó (cả hỏi đáp, luận giải).
import { Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

type Viet = "viet" | "trung";
type TN = "thang_sau" | "thang_chinh";

function Dong({ ten, goiY, noiBat, children }: { ten: string; goiY: string; noiBat?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-line/60 py-3 first:border-t-0 sm:grid-cols-[10rem_auto_1fr] sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-fg">{ten}</p>
      <div>{children}</div>
      <p className={cn("text-xs leading-relaxed", noiBat ? "text-moon" : "text-fg-faint")}>{goiY}</p>
    </div>
  );
}

export function TruongPhai(p: {
  lich: Viet; setLich: (v: Viet) => void; lichKhac: boolean;
  phaiDoSang: PhaiDoSang; setPhaiDoSang: (v: PhaiDoSang) => void;
  hoaLinh: Viet; setHoaLinh: (v: Viet) => void;
  thangNhuan: TN; setThangNhuan: (v: TN) => void; coNhuan: boolean;
  luuNguyet: PhaiLuuNguyet; setLuuNguyet: (v: PhaiLuuNguyet) => void;
}) {
  return (
    <section aria-labelledby="tieu-de-truong-phai" className="rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 sm:px-5" data-testid="truong-phai">
      <h2 id="tieu-de-truong-phai" className="flex items-center gap-2 text-base font-semibold">
        <Layers className="size-4 text-gold" aria-hidden /> Trường phái
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
        Tử vi có nhiều trường phái, mỗi phái theo nguồn sách riêng. Có lá số đổi phái vẫn gần như giống hệt, có lá khác hẳn —
        kéo theo lời luận khác. Mặc định theo <b className="text-fg">lối Việt</b> (sách Tử vi Việt Nam); chuyển sang để so sánh.
        Hỏi đáp và luận giải bên dưới đi theo đúng lựa chọn bạn đang xem.
      </p>
      <div className="mt-2">
        <Dong ten="Âm lịch" noiBat={p.lichKhac}
          goiY={p.lichKhac
            ? "Ngày sinh của bạn rơi vào đợt lịch Việt (UTC+7) và lịch Trung Quốc (UTC+8) lệch nhau — đổi lịch sẽ ra ngày/tháng âm khác, nên Mệnh, Cục và lời luận có thể khác."
            : "Ngày sinh của bạn hai lịch trùng nhau — đổi lịch không làm lá số thay đổi. (Sổ tử vi, phần mềm Trung Quốc đổi âm theo lịch Trung Quốc.)"}>
          <Tabs value={p.lich} onValueChange={(v) => p.setLich(v as Viet)}>
            <TabsList aria-label="Âm lịch dùng để lập lá số">
              <TabsTrigger value="viet">Lịch Việt Nam</TabsTrigger>
              <TabsTrigger value="trung">Lịch Trung Quốc</TabsTrigger>
            </TabsList>
          </Tabs>
        </Dong>
        <Dong ten="Độ sáng & tên sao" goiY="Bảng miếu/vượng/đắc/hãm và tên vòng Thái Tuế (Việt: Thái Tuế, Thiếu Dương, Tử Phù…; Trung: Tuế Kiện, Hối Khí, Tiểu Hao…). Vị trí sao không đổi.">
          <Tabs value={p.phaiDoSang} onValueChange={(v) => p.setPhaiDoSang(v as PhaiDoSang)}>
            <TabsList aria-label="Bảng độ sáng sao">
              <TabsTrigger value="nam" title="Bảng miếu/vượng/đắc/hãm theo sách Tử vi Việt">Độ sáng Nam phái</TabsTrigger>
              <TabsTrigger value="trung" title="Bảng của thư viện an sao (phái Trung Hoa)">Phái Trung</TabsTrigger>
            </TabsList>
          </Tabs>
        </Dong>
        <Dong ten="Hoả Tinh, Linh Tinh" goiY="Sách Việt đổi chiều an theo âm dương nam nữ; phái Trung Châu an cố định — có thể đổi cả cách cục (vd Hoả Tham ↔ Linh Tham).">
          <Tabs value={p.hoaLinh} onValueChange={(v) => p.setHoaLinh(v as Viet)}>
            <TabsList aria-label="Cách an Hoả Tinh, Linh Tinh">
              <TabsTrigger value="viet" title="Sách Tử vi Việt: chiều an đổi theo âm dương nam nữ">Hoả Linh lối Việt</TabsTrigger>
              <TabsTrigger value="trung" title="Phái Trung Châu">Trung Châu</TabsTrigger>
            </TabsList>
          </Tabs>
        </Dong>
        <Dong ten="Hạn tháng (lưu nguyệt)" goiY="Các phái khác nhau ở cung khởi tháng Giêng — cùng một tháng có thể rơi vào cung khác. Lá số gốc không đổi; chỉ đổi cung của từng tháng ở khung Lưu nguyệt và câu trả lời về tháng.">
          <select aria-label="Phái tính lưu nguyệt" value={p.luuNguyet} onChange={(e) => p.setLuuNguyet(e.target.value as PhaiLuuNguyet)}
            className="h-9 rounded-full border border-line bg-surface/60 px-3 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
            {(Object.keys(TEN_PHAI_LUU_NGUYET) as PhaiLuuNguyet[]).map((k) => <option key={k} value={k}>{TEN_PHAI_LUU_NGUYET[k]}</option>)}
          </select>
        </Dong>
        {p.coNhuan && (
          <div data-testid="chon-thang-nhuan">
            <Dong ten="Tháng nhuận" noiBat goiY="Bạn sinh nửa sau tháng nhuận — có phái tính sang tháng sau, có phái tính như tháng chính. Mệnh, Cục và các sao có thể khác.">
              <Tabs value={p.thangNhuan} onValueChange={(v) => p.setThangNhuan(v as TN)}>
                <TabsList aria-label="Cách tính tháng nhuận">
                  <TabsTrigger value="thang_sau">Tính sang tháng sau</TabsTrigger>
                  <TabsTrigger value="thang_chinh">Như tháng chính</TabsTrigger>
                </TabsList>
              </Tabs>
            </Dong>
          </div>
        )}
      </div>
    </section>
  );
}
