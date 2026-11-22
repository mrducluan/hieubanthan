"use client";
// Approach B — "Hỏi gì xem nấy" (Question-Intent-First): ánh xạ sang các intent của engine
// (`hoidap/phongthuy.py`, `Y_DINH`, `huyen-khong`, `do-huong`) + gọi API thật khi có dữ liệu nhà (`HoSoNha`),
// nhúng Lazy Intake khi thiếu dữ liệu & mở thẳng tới La Kinh 24 Sơn / KhungChat.
import { useEffect, useState } from "react";
import { ArrowDown, CheckCircle2, Clock, Compass, HelpCircle, MapPin, MessageSquare, Smartphone, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { gopTenHien, tenTheo, type TenHien } from "@/lib/ten-hien";
import { MatLaBan, timSonTaiDo } from "@/components/huyen-hoc/DoHuongDienThoai";
import { taiSon24, type MucSon24 } from "@/lib/la-ban-24-son";
import type { TrangThaiCamBien } from "@/lib/la-kinh/use-la-ban-cam-bien";
import { cn } from "@/lib/utils";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";

export type MaIntentPT = "cua_chinh" | "bo_cuc" | "gia_dinh" | "han_nam" | "so_sanh" | "mo_quan";
type SinhPayload = { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;

interface DoHuongRes {
  do_huong: number; huong: string; son_huong: string;
  trach: { quai: string; nhom: string };
  du_nien?: { du_nien: string; cat: boolean };
  canh_bao_y?: string | null;
  ten_hien?: TenHien;
}
interface HuyenKhongRes {
  van: number; cuc: string; cuc_ten: string;
  toa: { son: string; quai: string; phuong: string };
  huong: { son: string; quai: string; phuong: string };
  luu_nien: { nam: number; tam: number; sao_tam: string };
  cuc_y?: { y: string; goi_y: string };
  ten_hien?: TenHien;
}

interface MucHoi {
  ma: MaIntentPT;
  tieu_de_vi: string; tieu_de_en: string;
  goi_y_vi: string; goi_y_en: string;
  trang_thai: "san_sang" | "pending";
  badge_vi: string; badge_en: string;
  can_huong?: boolean;
  can_sinh?: boolean;
  neo_la_ban?: string;
  cung_mac_dinh?: string;
  ket_luan_chung_vi: string; ket_luan_chung_en: string;
  viec_vi: string[]; viec_en: string[];
  vi_sao_bach_thoai_vi: string; vi_sao_bach_thoai_en: string;
  vi_sao_hoc_thuat_vi: string; vi_sao_hoc_thuat_en: string;
  nguon_vi: string; nguon_en: string;
  cau_hoi_chat_vi: string; cau_hoi_chat_en: string;
}

const DANH_SACH_HOI: MucHoi[] = [
  {
    ma: "cua_chinh",
    tieu_de_vi: "Cửa chính hướng này có hợp không?",
    tieu_de_en: "Does my main door direction suit me?",
    goi_y_vi: "Đối chiếu Bát Trạch + Huyền Không",
    goi_y_en: "Kua + Flying Star check",
    trang_thai: "san_sang",
    badge_vi: "Sẵn sàng", badge_en: "Ready",
    can_huong: true, can_sinh: true,
    neo_la_ban: "#do-huong",
    cung_mac_dinh: "Ly",
    ket_luan_chung_vi: "Hướng dẫn chung (chưa phải kết quả nhà bạn): đo độ cửa chính để hệ thống đối chiếu Trạch–Mệnh và Huyền Không.",
    ket_luan_chung_en: "General guide (not your home's verdict yet): measure your door degrees to compute Kua & Flying Stars.",
    viec_vi: [
      "0đ (Việc tuần): Giữ lối vào cửa chính sáng, gọn, không để giày dép hoặc tủ cao chắn khí.",
      "Nếu lệch tâm sơn > 3° (Kiêm hướng): Bấm đo lại 3 lần hoặc đối chiếu trên ảnh vệ tinh trước khi chốt."
    ],
    viec_en: [
      "Zero-cost: Keep the main entrance bright and uncluttered so airflow isn't blocked.",
      "If off-centre > 3°: Re-measure a few times or cross-check on the satellite map."
    ],
    vi_sao_bach_thoai_vi: "Cửa chính là nơi đón khí vào nhà. Khi biết chính xác độ la bàn và năm xây/dọn vào, hệ thống đối chiếu đồng thời tuổi chủ nhà (Bát Trạch) và sao tốt/xấu tại cửa (Huyền Không).",
    vi_sao_bach_thoai_en: "The main door brings energy into the home. With an accurate degree and move-in year, we check both your Kua match and the Flying Stars at the door.",
    vi_sao_hoc_thuat_vi: "Định tuyến engine `/api/phongthuy/do-huong` + `/api/phongthuy/huyen-khong`: kiểm ranh sơn ±0.5° (không vong), >3° (kiêm hướng → Thế Quái), và du niên tại cung hướng.",
    vi_sao_hoc_thuat_en: "Routes to `/api/phongthuy/do-huong` + `/api/phongthuy/huyen-khong`: checks ±0.5° void boundary, >3° replacement-star threshold, and Ba Zhai facing sector.",
    nguon_vi: "Dương Trạch Tam Yếu (Du niên) · Thẩm Thị Huyền Không Học (Sơn–Hướng tinh).",
    nguon_en: "Yang Zhai San Yao (Eight Mansions) · Shen's Xuan Kong (Mountain & Facing Stars).",
    cau_hoi_chat_vi: "Cửa chính nhà tôi hướng hiện tại có hợp tuổi và vận nhà không?",
    cau_hoi_chat_en: "Does my current main door direction suit my birth year and house period?"
  },
  {
    ma: "bo_cuc",
    tieu_de_vi: "Nhà có phạm lỗi nặng (Loan Đầu / Bếp / WC) không?",
    tieu_de_en: "Are there major layout flaws (door, kitchen, WC)?",
    goi_y_vi: "Khảo sát 23 dấu hiệu & trần mức Veto",
    goi_y_en: "23 layout signs & veto cap",
    trang_thai: "san_sang",
    badge_vi: "Sẵn sàng", badge_en: "Ready",
    neo_la_ban: "#khao-sat-nha",
    cung_mac_dinh: "Trung cung",
    ket_luan_chung_vi: "Nguyên tắc chung: rà các lỗi Veto (WC Trung cung, Xuyên đường sát, Bếp–Cửa xung) ở mục Khảo sát nhà bên dưới trước khi bàn tới sao đẹp.",
    ket_luan_chung_en: "General rule: check severe layout vetoes (center WC, door-to-balcony alignment) below before optimizing stars.",
    viec_vi: [
      "0đ: Kéo rèm nhẹ / đặt bình phong nếu cửa chính thông thẳng ban công (Xuyên đường sát).",
      "Chung cư: Hệ thống tự ẩn các gợi ý đập phá kết cấu (_giu_can_ho), chỉ giữ cách kê xếp 0đ."
    ],
    viec_en: [
      "Zero-cost: Use a light screen/curtain if the front door aligns straight with the balcony.",
      "Apartments: Structural demolition advice is automatically filtered out."
    ],
    vi_sao_bach_thoai_vi: "Theo nguyên tắc thầy phong thủy: hình thế bố cục bên trong/ngoài quan trọng hơn số sao. Nếu nhà phạm lỗi nặng, đánh giá tổng thể sẽ bị giữ ở mức Cân bằng để bạn ưu tiên sửa lỗi đó trước.",
    vi_sao_bach_thoai_en: "Form and layout come before star numbers. Severe flaws cap the overall house rating so you fix those first.",
    vi_sao_hoc_thuat_vi: "Áp dụng `dau_hieu_veto()` + `_ap_tran_muc` (`phongthuy_bo_cuc.py`) và kiểm tra hình học lưới 3×3 (`mat_bang.py`: `wc_trung_cung`, `khuyet_goc < 40%`, `cua_thong_ban_cong`).",
    vi_sao_hoc_thuat_en: "Applies `dau_hieu_veto()` + `_ap_tran_muc` (`phongthuy_bo_cuc.py`) and 3×3 grid geometry (`mat_bang.py`: center WC, missing corners < 40%, straight-through door).",
    nguon_vi: "Táng Thư (Khí thừa phong tắc tán) · Dương Trạch Tam Yếu (Cửa–Chủ–Bếp).",
    nguon_en: "Book of Burial · Yang Zhai San Yao (Door–Master–Stove).",
    cau_hoi_chat_vi: "Nhà tôi có phạm lỗi bố cục hay ngoại cảnh nào cần hóa giải trước không?",
    cau_hoi_chat_en: "Does my home have any layout or external flaws I should address first?"
  },
  {
    ma: "gia_dinh",
    tieu_de_vi: "Vợ chồng / Cả nhà khác mệnh thì bố trí sao?",
    tieu_de_en: "How to arrange rooms when family members differ?",
    goi_y_vi: "Hợp cung chung & hành Thông quan",
    goi_y_en: "Shared sectors & bridging element",
    trang_thai: "san_sang",
    badge_vi: "Sẵn sàng", badge_en: "Ready",
    can_sinh: true,
    neo_la_ban: "#nha-cua-ban",
    cung_mac_dinh: "Khảm",
    ket_luan_chung_vi: "Nguyên tắc phối hợp: dùng hướng cửa theo trụ cột, phòng ngủ riêng xoay theo từng người và dùng hành Thông quan điều hòa.",
    ket_luan_chung_en: "General approach: align the main door to the household lead, bedrooms per person, and balance via a bridging element.",
    viec_vi: [
      "Nhập thêm năm sinh các thành viên ở mục Nhà của bạn để tính cung chung (`huong_chung`).",
      "Nếu Đông Tứ & Tây Tứ trái nhóm: giữ cửa chính hợp trụ cột, điều chỉnh hướng đầu giường ở phòng riêng."
    ],
    viec_en: [
      "Add household members in 'Your Home' to compute shared favorable directions.",
      "When East/West groups differ: prioritize main door for lead, adjust bed directions per bedroom."
    ],
    vi_sao_bach_thoai_vi: "Hiếm gia đình nào mọi người cùng chung một nhóm Đông/Tây Tứ Mệnh. Thay vì ép đổi nhà, thầy phong thủy chia ưu tiên theo không gian chung (cửa, phòng khách) và không gian riêng (phòng ngủ, bàn làm việc).",
    vi_sao_bach_thoai_en: "Rarely do all family members share the same East/West group. Split priority between shared areas (door) and private rooms (beds/desks).",
    vi_sao_hoc_thuat_vi: "Engine tính `menh_quai` từng người trong `_thanh_vien`, xác định `cung_nhom_voi_chu`, `huong_chung` và hành trung gian `hk.thong_quan`.",
    vi_sao_hoc_thuat_en: "Computes per-member `menh_quai` in `_thanh_vien`, deriving `huong_chung` and bridging element `hk.thong_quan`.",
    nguon_vi: "Dương Trạch Thập Thư · Dương Trạch Tam Yếu (Mệnh–Trạch phối hợp).",
    nguon_en: "Yang Zhai Shi Shu · Yang Zhai San Yao.",
    cau_hoi_chat_vi: "Gia đình tôi có nhiều người khác mệnh thì nên ưu tiên cửa và phòng ngủ thế nào?",
    cau_hoi_chat_en: "Our family members have different Kua groups—how should we prioritize door and bedrooms?"
  },
  {
    ma: "han_nam",
    tieu_de_vi: "Năm nay góc nào xấu, tuổi nào kỵ động thổ?",
    tieu_de_en: "Which sector needs care this year, and is renovation safe?",
    goi_y_vi: "Lưu niên Tử Bạch + Thái Tuế + Kim Lâu/Hoang Ốc",
    goi_y_en: "Annual stars + Tai Sui + Folk renovation ages",
    trang_thai: "san_sang",
    badge_vi: "Sẵn sàng", badge_en: "Ready",
    can_huong: true, can_sinh: true,
    neo_la_ban: "#huyen-khong",
    cung_mac_dinh: "Ly",
    ket_luan_chung_vi: "Nguyên tắc lưu niên: tránh khoan đục, sửa lớn tại cung có Ngũ Hoàng (5) & Thái Tuế năm nay (tính từ Lập Xuân).",
    ket_luan_chung_en: "Annual rule: avoid heavy drilling or renovation in the annual Five Yellow & Tai Sui sectors (from Start of Spring).",
    viec_vi: [
      "0đ: Giữ cung có sao 5 Vàng / 2 Đen yên tĩnh, sạch thoáng; tránh gõ đập ồn ào.",
      "Xem tuổi làm nhà (Kim Lâu / Hoang Ốc / Tam Tai): tham khảo theo quan niệm dân gian Việt."
    ],
    viec_en: [
      "Zero-cost: Keep annual 5-Yellow / 2-Black sectors quiet and clean; avoid noisy construction there.",
      "Renovation age checks (Kim Lâu / Hoang Ốc / Tam Tai) are flagged clearly as folk conventions."
    ],
    vi_sao_bach_thoai_vi: "Mỗi năm (đổi từ tiết Lập Xuân ~4/2), các sao lưu niên lại di chuyển sang cung mới. Biết trước góc nào có sao xấu giúp bạn tránh sửa chữa vào đúng góc đó trong năm.",
    vi_sao_bach_thoai_en: "Each year (from Start of Spring ~Feb 4), annual stars shift sectors. Knowing where the 5-Yellow lands prevents unnecessary disruption.",
    vi_sao_hoc_thuat_vi: "Tính lưu niên Tử Bạch, Thái Tuế, Tuế Phá, Tam Sát theo `zibai` + `nam_sao_toi` (6 năm) và đối chiếu `tuoi_lam_nha`.",
    vi_sao_hoc_thuat_en: "Computes annual Purple-White stars, Tai Sui, Three Killings (`nam_sao_toi`), and folk `tuoi_lam_nha`.",
    nguon_vi: "Tử Bạch Quyết · Hiệp Kỷ Biện Phương Thư (Niên thần phương vị).",
    nguon_en: "Zi Bai Jue · Xie Ji Bian Fang Shu.",
    cau_hoi_chat_vi: "Năm nay nhà tôi cần tránh động thổ ở góc nào và lưu niên có sao gì?",
    cau_hoi_chat_en: "Which sector should avoid renovation this year and what are the annual stars?"
  },
  {
    ma: "so_sanh",
    tieu_de_vi: "Đang phân vân 2 căn (mua/thuê), căn nào ít lỗi hơn?",
    tieu_de_en: "Comparing 2 homes to buy/rent: which has fewer flaws?",
    goi_y_vi: "Lưu tới 3 căn & đối chiếu Veto vs Sửa được",
    goi_y_en: "Save up to 3 homes & compare",
    trang_thai: "san_sang",
    badge_vi: "Sẵn sàng", badge_en: "Ready",
    neo_la_ban: "#hanh-trinh-nha",
    ket_luan_chung_vi: "Cách so sánh: lưu từng căn vào Hành trình nhà (tối đa 3 căn) để đặt cạnh nhau đối chiếu lỗi kết cấu vs lỗi bài trí.",
    ket_luan_chung_en: "How to compare: save each candidate (up to 3 homes) to compare structural vetoes vs easy fixes side by side.",
    viec_vi: [
      "Lưu căn 1 (hiện tại hoặc căn A), bấm 'Nhà khác' hoặc 'Lưu để so' rồi nhập căn B.",
      "Ưu tiên loại căn dính lỗi kết cấu khó sửa (WC Trung cung, khuyết góc lớn) trước khi xét hướng."
    ],
    viec_en: [
      "Save home A, then click 'Save to compare' and enter home B.",
      "Filter out structural flaws (center WC, major missing corners) before comparing minor placements."
    ],
    vi_sao_bach_thoai_vi: "Khi đi xem nhà mua hoặc thuê, lỗi kỵ lớn nhất là lỗi cấu trúc không sửa được. Công cụ So hai căn giúp bạn đặt 2 phương án cạnh nhau theo cùng một thước đo.",
    vi_sao_bach_thoai_en: "When house-hunting, unfixable structural flaws matter most. Side-by-side comparison puts both candidates on the same rubric.",
    vi_sao_hoc_thuat_vi: "Component `SoHaiCan.tsx` chạy `/api/phongthuy/luan-giai` song song cho 2 hồ sơ nhà trong `hbt.nha.v1`.",
    vi_sao_hoc_thuat_en: "`SoHaiCan.tsx` runs parallel `/api/phongthuy/luan-giai` evaluations across saved `hbt.nha.v1` profiles.",
    nguon_vi: "Hồ sơ nhà trên máy (`hbt.nha.v1`) · Bộ quy tắc `phongthuy_bo_cuc.py`.",
    nguon_en: "Local home profiles (`hbt.nha.v1`) · `phongthuy_bo_cuc.py`.",
    cau_hoi_chat_vi: "Khi so sánh 2 căn nhà, tiêu chí nào là lỗi nặng nên tránh?",
    cau_hoi_chat_en: "When comparing two homes, which flaws should be treated as dealbreakers?"
  },
  {
    ma: "mo_quan",
    tieu_de_vi: "Mở quán / Đặt thu ngân & Chọn ngày khai trương?",
    tieu_de_en: "Shop opening: cashier placement & opening date?",
    goi_y_vi: "Thành Môn (sẵn sàng) + Hoàng Lịch (đang hoàn thiện)",
    goi_y_en: "Castle Gate (ready) + Almanac (in progress)",
    trang_thai: "pending",
    badge_vi: "Đang hoàn thiện", badge_en: "In progress",
    neo_la_ban: "#huyen-khong",
    cung_mac_dinh: "Cấn",
    ket_luan_chung_vi: "Phần tìm vị trí Thành Môn (cửa phụ / quầy thu ngân) đã chạy trên La Kinh; phần xếp hạng ngày khai trương đang hoàn thiện.",
    ket_luan_chung_en: "Castle Gate (cashier/side-door) detection is live on the Flying Star chart; opening-date ranking is currently being finalized.",
    viec_vi: [
      "Mở La Kinh Huyền Không bên dưới để xem huy hiệu 'Thành Môn' (cung vượng tài phụ trợ cửa chính).",
      "Lịch chọn ngày khai trương (`hoang_lich.chon_ngay`) đang chờ hoàn tất rà soát kỹ thuật trước khi bật chính thức."
    ],
    viec_en: [
      "Open the Flying Star chart below to see the 'Gate' (Castle Gate) badge for cashier/side entrance placement.",
      "Opening-date ranking (`hoang_lich`) is undergoing final technical review before public release."
    ],
    vi_sao_bach_thoai_vi: "Với mặt bằng kinh doanh, ngoài cửa chính đón khách, Thành Môn là vị trí rất tốt để đặt quầy thu ngân hoặc mở cửa phụ kích hoạt tài khí. Riêng phần chọn ngày khai trương đang được kiểm tra kỹ lại để đảm bảo độ chính xác.",
    vi_sao_bach_thoai_en: "For shops, Castle Gate is a strong secondary wealth sector for the cashier or side door. Opening-day ranking is under final verification.",
    vi_sao_hoc_thuat_vi: "Huyền Không tính `thanh_mon` (`chinh` / `phu`, kiểm điều kiện `dung_duoc`). Module `hoang_lich.chon_ngay()` đang tạm khóa ở trạng thái đang hoàn thiện (chờ PR audit).",
    vi_sao_hoc_thuat_en: "Flying Stars computes `thanh_mon` (`chinh` / `phu`, `dung_duoc`). `hoang_lich.chon_ngay()` is gated pending audit completion.",
    nguon_vi: "Thẩm Thị Huyền Không Học (Thành Môn quyết).",
    nguon_en: "Shen's Xuan Kong (Castle Gate method).",
    cau_hoi_chat_vi: "Mặt bằng kinh doanh thì đặt quầy thu ngân theo Thành Môn thế nào?",
    cau_hoi_chat_en: "How does Castle Gate apply to placing a shop cashier?"
  }
];

export function HoiGiXemNay({
  sinh,
  camBien,
  onChotHuong,
  onChonCung,
  onHoiTiep,
}: {
  sinh: SinhPayload;
  camBien?: TrangThaiCamBien;
  onChotHuong?: (kq: { do_huong: number; huong: string }) => void;
  onChonCung?: (cung: string) => void;
  onHoiTiep?: (cauHoi: string) => void;
}) {
  const nha = useHoSoNha();
  const { c: t, en } = useChuPT();
  const [chon, setChon] = useState<MaIntentPT>("cua_chinh");
  const [bachThoai, setBachThoai] = useState(true);
  const [doHuongKQ, setDoHuongKQ] = useState<DoHuongRes | null>(null);
  const [hkKQ, setHkKQ] = useState<HuyenKhongRes | null>(null);
  const [son24, setSon24] = useState<MucSon24[] | null>(null);
  const [moNhanh, setMoNhanh] = useState(false);
  const [doNhanh, setDoNhanh] = useState<number>(180);
  const [nhapDo, setNhapDo] = useState("180");
  const [namXayNhap, setNamXayNhap] = useState("2024");
  const [dangChot, setDangChot] = useState(false);
  const [loiNhanh, setLoiNhanh] = useState<string | null>(null);

  useEffect(() => {
    let huy = false;
    taiSon24().then((ds) => { if (!huy && ds) setSon24(ds); });
    return () => { huy = true; };
  }, []);

  useEffect(() => {
    if (nha?.huong_do != null) {
      setDoNhanh(nha.huong_do);
      setNhapDo(String(Math.round(nha.huong_do)));
    }
    if (nha?.nam_xay) setNamXayNhap(String(nha.nam_xay));
  }, [nha?.huong_do, nha?.nam_xay]);

  useEffect(() => {
    if (camBien?.ketQua && moNhanh) {
      setDoNhanh(camBien.ketQua.mean);
      setNhapDo(String(Math.round(camBien.ketQua.mean)));
    }
  }, [camBien?.ketQua, moNhanh]);

  const coHuong = Boolean(nha && (nha.huong_do != null || nha.huong));
  const coSinh = Boolean(sinh);
  const sinhKey = sinh ? `${sinh.birth_date}|${sinh.gender}|${sinh.moc_nam ?? "lap_xuan"}` : "";

  // Gọi engine thật khi có dữ liệu nhà trên máy (HoSoNha) để hiển thị kết luận thực tế cho cua_chinh & han_nam.
  useEffect(() => {
    let huy = false;
    if (nha?.huong_do != null) {
      postJson<DoHuongRes>("/api/phongthuy/do-huong", {
        do_huong: nha.huong_do,
        ...(sinh ? { sinh } : {}),
      }).then((kq) => { if (!huy) setDoHuongKQ(kq); }).catch(() => { if (!huy) setDoHuongKQ(null); });
    } else {
      setDoHuongKQ(null);
    }

    if (nha?.nam_xay && (nha.huong_do != null || nha.toa)) {
      const doToa = nha.huong_do != null ? Math.round(((nha.huong_do + 180) % 360) * 10) / 10 : undefined;
      postJson<HuyenKhongRes>("/api/phongthuy/huyen-khong", {
        nam_xay: nha.nam_xay,
        ...(doToa != null ? { do: doToa } : { toa: nha.toa }),
      }).then((kq) => { if (!huy) setHkKQ(kq); }).catch(() => { if (!huy) setHkKQ(null); });
    } else {
      setHkKQ(null);
    }
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nha?.huong_do, nha?.nam_xay, nha?.toa, sinhKey]);

  const muc = DANH_SACH_HOI.find((x) => x.ma === chon) ?? DANH_SACH_HOI[0]!;
  const thieuHuong = Boolean(muc.can_huong && !coHuong);
  const thieuSinh = Boolean(muc.can_sinh && !coSinh);
  const tn = tenTheo(gopTenHien(doHuongKQ?.ten_hien, hkKQ?.ten_hien), en);
  const thieuNamXay = Boolean((chon === "cua_chinh" || chon === "han_nam") && !nha?.nam_xay);
  const sonNhanh = timSonTaiDo(son24, doNhanh);

  const chotNhanh = async () => {
    const parsed = Number(nhapDo.replace(",", "."));
    const d = Number.isFinite(parsed) && nhapDo.trim() !== "" ? parsed : doNhanh;
    if (!(d >= 0 && d < 360)) {
      setLoiNhanh(en ? "Enter a degree between 0 and 359.9." : "Nhập số độ từ 0 đến dưới 360.");
      return;
    }
    setDangChot(true);
    setLoiNhanh(null);
    try {
      const kq = await postJson<DoHuongRes>("/api/phongthuy/do-huong", {
        do_huong: d,
        ...(sinh ? { sinh } : {}),
      });
      setDoHuongKQ(kq);
      const namParsed = Number(namXayNhap);
      const namHopLe = Number.isInteger(namParsed) && namParsed >= 1900 && namParsed <= 2100 ? namParsed : undefined;
      try {
        luuHoSoNha({
          huong_do: kq.do_huong,
          huong: undefined,
          ...(namHopLe && !nha?.nam_xay ? { nam_xay: namHopLe } : {}),
        });
      } catch { /* bỏ qua */ }
      onChotHuong?.({ do_huong: kq.do_huong, huong: kq.huong });
      setMoNhanh(false);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_gi_chot_la_kinh", do_huong: kq.do_huong });
    } catch (e) {
      setLoiNhanh(e instanceof Error ? e.message : (en ? "Failed to compute direction." : "Không tính được hướng."));
    } finally {
      setDangChot(false);
    }
  };

  const luuNamNhanh = () => {
    const namParsed = Number(namXayNhap);
    if (!(Number.isInteger(namParsed) && namParsed >= 1900 && namParsed <= 2100)) {
      setLoiNhanh(en ? "Enter a valid build/move-in year (1900–2100)." : "Nhập năm xây/dọn vào hợp lệ (1900–2100).");
      return;
    }
    setLoiNhanh(null);
    try { luuHoSoNha({ nam_xay: namParsed }); } catch { /* bỏ qua */ }
  };

  const chonMuc = (ma: MaIntentPT) => {
    setChon(ma);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_gi_intent", intent: ma });
  };

  const moLaKinh = () => {
    const cungDich = (chon === "cua_chinh" && hkKQ?.huong.quai) ? hkKQ.huong.quai : muc.cung_mac_dinh;
    if (cungDich && onChonCung) onChonCung(cungDich);
    const el = document.getElementById(muc.neo_la_ban?.replace("#", "") || "huyen-khong");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_gi_mo_la_kinh", intent: muc.ma });
  };

  return (
    <section
      aria-labelledby="hoi-gi-tieu-de"
      className="mx-auto mb-6 max-w-3xl min-w-0 overflow-hidden rounded-2xl border border-gold/30 bg-surface/60 p-4 sm:p-5 glass"
      data-testid="hoi-gi-xem-nay"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-gold" aria-hidden />
            {t("hg.eyebrow")}
          </p>
          <h2 id="hoi-gi-tieu-de" className="mt-1 text-lg sm:text-xl font-medium text-fg">
            {t("hg.tieu_de")}
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">{t("hg.mo_ta")}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg">
          <input
            type="checkbox"
            checked={bachThoai}
            onChange={(e) => setBachThoai(e.target.checked)}
            data-testid="hoi-gi-bach-thoai"
          />
          <span>{t("hg.bach_thoai")}</span>
        </label>
      </div>

      {/* Lưới câu hỏi theo intent */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={t("hg.tieu_de")}>
        {DANH_SACH_HOI.map((item) => {
          const active = item.ma === chon;
          return (
            <button
              key={item.ma}
              type="button"
              role="radio"
              aria-checked={active}
              data-testid={`hoi-gi-intent-${item.ma}`}
              onClick={() => chonMuc(item.ma)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left motion-reduce:transition-none transition-colors",
                active
                  ? "border-gold bg-gold/12 text-fg ring-1 ring-gold/50"
                  : "border-line/70 bg-bg/40 text-fg-muted hover:border-gold/50 hover:text-fg",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                  item.trang_thai === "pending"
                    ? "bg-moon/15 text-moon"
                    : "bg-jade/15 text-jade",
                )}
              >
                {item.trang_thai === "pending" ? <Clock className="size-2.5" aria-hidden /> : <CheckCircle2 className="size-2.5" aria-hidden />}
                {en ? item.badge_en : item.badge_vi}
              </span>
              <span className="text-sm font-medium leading-snug text-fg">
                {en ? item.tieu_de_en : item.tieu_de_vi}
              </span>
              <span className="text-[0.72rem] text-fg-faint">
                {en ? item.goi_y_en : item.goi_y_vi}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thẻ trả lời trực diện + kết quả tính thật từ Engine (nếu đủ dữ liệu) + Lazy Intake */}
      <div className="mt-4 rounded-xl border border-line/80 bg-bg/50 p-4 space-y-3" data-testid="hoi-gi-ket-qua" aria-live="polite">
        {chon === "cua_chinh" && doHuongKQ ? (
          <div className="rounded-lg border border-jade/40 bg-jade/10 p-3 text-xs space-y-1" data-testid="hoi-gi-ket-qua-thuc">
            <p className="text-sm font-medium text-fg">
              {doHuongKQ.du_nien?.cat ? "✓ " : "⚠ "}
              {en
                ? `Measured door: ${doHuongKQ.do_huong}° (${tn("huong", doHuongKQ.huong)} · ${tn("son", doHuongKQ.son_huong)})`
                : `Hướng cửa đã đo: ${doHuongKQ.do_huong}° (${doHuongKQ.huong} · sơn ${doHuongKQ.son_huong})`}
              {doHuongKQ.du_nien ? ` — ${tn("du_nien", doHuongKQ.du_nien.du_nien)}` : ""}
            </p>
            {hkKQ && (
              <p className="text-fg-muted">
                {en
                  ? `Flying Stars Period ${hkKQ.van}: ${tn("cuc_hk", hkKQ.cuc)} · Facing ${tn("quai", hkKQ.huong.quai)}.`
                  : `Huyền Không Vận ${hkKQ.van}: ${hkKQ.cuc_ten} · Hướng ${hkKQ.huong.quai}.`}
              </p>
            )}
            {doHuongKQ.canh_bao_y && <p className="text-moon">{doHuongKQ.canh_bao_y}</p>}
          </div>
        ) : chon === "han_nam" && hkKQ ? (
          <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs space-y-1" data-testid="hoi-gi-ket-qua-thuc">
            <p className="text-sm font-medium text-fg">
              {en
                ? `Annual ${hkKQ.luu_nien.nam}: ${tn("sao_bay", hkKQ.luu_nien.sao_tam)} in Centre · Period ${hkKQ.van} (${tn("cuc_hk", hkKQ.cuc)})`
                : `Lưu niên ${hkKQ.luu_nien.nam}: ${hkKQ.luu_nien.sao_tam} nhập trung · Vận ${hkKQ.van} (${hkKQ.cuc_ten})`}
            </p>
            {hkKQ.cuc_y && <p className="text-fg-muted">{hkKQ.cuc_y.goi_y}</p>}
          </div>
        ) : (
          <p className="text-sm font-medium text-fg">
            {en ? muc.ket_luan_chung_en : muc.ket_luan_chung_vi}
          </p>
        )}

        {(thieuHuong || thieuSinh || thieuNamXay) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-moon/40 bg-moon/10 px-3 py-2 text-xs text-fg" data-testid="hoi-gi-lazy-intake">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 shrink-0 text-moon" aria-hidden />
              <span>
                {thieuHuong
                  ? t("hg.thieu_huong")
                  : thieuNamXay
                    ? (en ? "Add your house build/move-in year to calculate Flying Stars:" : "Bổ sung năm xây / nhập trạch để lập Huyền Không ngay:")
                    : t("hg.thieu_sinh")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {muc.can_huong && (
                <button
                  type="button"
                  onClick={() => setMoNhanh((v) => !v)}
                  data-testid="hoi-gi-bat-la-kinh"
                  className="inline-flex items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-2.5 py-1 font-medium text-gold hover:bg-gold/25"
                >
                  <Compass className="size-3" aria-hidden />
                  {moNhanh ? (en ? "Hide Quick Compass" : "Thu gọn La Kinh") : t("hg.do_ngay")}
                </button>
              )}
              {thieuNamXay && !moNhanh && (
                <div className="inline-flex items-center gap-1">
                  <Input
                    aria-label={en ? "Quick build year" : "Năm xây nhanh (Hỏi gì xem nấy)"}
                    value={namXayNhap}
                    onChange={(e) => setNamXayNhap(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-7 w-20 text-xs"
                    data-testid="hoi-la-kinh-nam-xay"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={luuNamNhanh} className="h-7 px-2 text-xs" data-testid="hoi-la-kinh-luu-nam">
                    {en ? "Apply" : "Áp dụng"}
                  </Button>
                </div>
              )}
              {thieuSinh && (
                <a
                  href="#menh-quai"
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-surface/60 px-2.5 py-1 font-medium text-fg hover:border-gold/50"
                >
                  {t("hg.nhap_sinh")}
                </a>
              )}
            </div>
          </div>
        )}

        {muc.can_huong && moNhanh && (
          <div className="rounded-xl border border-gold/40 bg-surface/50 p-3.5 space-y-3" data-testid="hoi-la-kinh-panel">
            <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
              <div>
                <MatLaBan
                  compact
                  doHuong={doNhanh}
                  saiSoDo={camBien?.ketQua?.saiSoDo ?? 0}
                  son24={son24}
                  onXoay={(d) => {
                    setDoNhanh(d);
                    setNhapDo(String(Math.round(d)));
                    setLoiNhanh(null);
                  }}
                />
                <p className="mt-1 text-center font-serif text-lg text-gold" data-testid="hoi-la-kinh-do-so">
                  {Math.round(doNhanh)}°
                  {sonNhanh ? <span className="ml-1.5 text-xs font-sans text-fg-muted">· {en ? sonNhanh.ky_hieu_han : sonNhanh.son} ({sonNhanh.nguyen})</span> : null}
                </p>
              </div>
              <div className="space-y-2.5 text-xs">
                <p className="text-fg-muted">
                  {en
                    ? "Rotate the 24-Mountain dial, measure with your phone compass, or enter degrees directly to compute Kua & Flying Stars right here."
                    : "Xoay mặt La Kinh 24 sơn, bấm đo bằng cảm biến điện thoại hoặc nhập số độ để tính Bát Trạch & Huyền Không ngay tại đây."}
                </p>
                {camBien?.dangDo && camBien.ketQua && (
                  <p className="text-[11px] text-fg-muted" data-testid="hoi-la-kinh-on-dinh">
                    {en ? `Stability (R): ${camBien.ketQua.onDinhPct}% · ±${camBien.ketQua.saiSoDo}°` : `Độ ổn định (R): ${camBien.ketQua.onDinhPct}% · ±${camBien.ketQua.saiSoDo}°`}
                    {!camBien.ketQua.phang ? (en ? " · Hold phone flatter" : " · Giữ máy phẳng hơn") : ""}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {camBien && (
                    <Button type="button" size="sm" variant="secondary" onClick={() => void camBien.batDau()} data-testid="hoi-la-kinh-cam-bien">
                      <Smartphone className="mr-1 size-3.5" aria-hidden />
                      {camBien.dangDo ? (en ? "Sampling..." : "Đang đo...") : (en ? "Phone compass" : "Đo điện thoại")}
                    </Button>
                  )}
                  <Input
                    aria-label={en ? "Door degree" : "Độ hướng cửa"}
                    inputMode="decimal"
                    value={nhapDo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.,]/g, "").slice(0, 6);
                      setNhapDo(val);
                      const num = Number(val.replace(",", "."));
                      if (val !== "" && Number.isFinite(num) && num >= 0 && num < 360) setDoNhanh(num);
                    }}
                    className="h-8 w-24 text-xs"
                    data-testid="hoi-la-kinh-nhap"
                  />
                  {thieuNamXay && (
                    <Input
                      aria-label={en ? "Quick build year" : "Năm xây nhanh (Hỏi gì xem nấy)"}
                      value={namXayNhap}
                      onChange={(e) => setNamXayNhap(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="2024"
                      className="h-8 w-20 text-xs"
                      data-testid="hoi-la-kinh-nam-xay"
                    />
                  )}
                  <Button type="button" size="sm" onClick={() => void chotNhanh()} disabled={dangChot} data-testid="hoi-la-kinh-chot">
                    {dangChot ? (en ? "Saving..." : "Đang tính...") : (en ? "Lock direction" : "Chốt hướng")}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
                  <span>{en ? "Magnetic north may drift indoors." : "Cảm biến đo Bắc từ; nên đối chiếu ảnh vệ tinh."}</span>
                  <a href="#do-huong" className="inline-flex items-center gap-1 text-gold hover:underline">
                    <MapPin className="size-3" aria-hidden /> {en ? "Satellite cross-check" : "Chấm ảnh vệ tinh"}
                  </a>
                </div>
                {(loiNhanh || camBien?.loi) && <p className="text-cinnabar">{loiNhanh ?? camBien?.loi}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs space-y-1.5">
          <p className="font-medium text-gold">{t("hg.viec_lam")}</p>
          <ul className="list-disc pl-4 space-y-1 text-fg-muted">
            {(en ? muc.viec_en : muc.viec_vi).map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>

        <details className="rounded-lg border border-line/60 bg-surface/40 p-3 text-xs" data-testid="hoi-gi-vi-sao">
          <summary className="cursor-pointer font-medium text-fg flex items-center gap-1.5">
            <HelpCircle className="size-3.5 text-gold" aria-hidden />
            {t("hg.vi_sao")}
          </summary>
          <p className="mt-2 leading-relaxed text-fg-muted">
            {bachThoai
              ? (en ? muc.vi_sao_bach_thoai_en : muc.vi_sao_bach_thoai_vi)
              : (en ? muc.vi_sao_hoc_thuat_en : muc.vi_sao_hoc_thuat_vi)}
          </p>
          <p className="mt-2 border-l-2 border-gold/60 pl-2 text-[0.72rem] text-fg-faint">
            <b className="text-fg-muted">{t("hg.nguon")}</b> {en ? muc.nguon_en : muc.nguon_vi}
          </p>
        </details>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {muc.cung_mac_dinh && (
            <Button type="button" size="sm" variant="outline" onClick={moLaKinh} data-testid="hoi-gi-mo-la-kinh">
              <Compass className="mr-1.5 size-3.5" aria-hidden />
              {t("hg.mo_la_kinh")}
            </Button>
          )}
          {onHoiTiep && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onHoiTiep(en ? muc.cau_hoi_chat_en : muc.cau_hoi_chat_vi)}
              data-testid="hoi-gi-hoi-tiep"
            >
              <MessageSquare className="mr-1.5 size-3.5" aria-hidden />
              {t("hg.hoi_tiep")}
            </Button>
          )}
          <a href="#menh-quai" className="ml-auto inline-flex items-center gap-1 text-[0.72rem] text-fg-faint hover:text-fg">
            {t("hg.toan_canh")} <ArrowDown className="size-3" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
