// PL-1 — Giới thiệu & phương pháp: sứ mệnh, cách hệ thống tính (4 tầng), nguồn tri thức và mã nguồn mở đã dùng
// (đúng giấy phép, theo bảng "Quyết định đã chốt" trong CLAUDE.md). Tăng độ tin cậy cho người dùng và máy tìm kiếm.
import type { Metadata } from "next";
import Link from "next/link";
import { Bang, TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { vanHanh } from "@/lib/van-hanh";

export const metadata: Metadata = {
  title: "Giới thiệu & phương pháp",
  description: "Hiểu Bản Thân là gì, tính toán ra sao, kho tri thức lấy từ đâu và dùng những mã nguồn mở nào.",
  alternates: { canonical: "/gioi-thieu" },
};

export default function GioiThieu() {
  const vh = vanHanh();
  const muc: Muc[] = [
    {
      id: "su-menh", tieuDe: "Chúng tôi làm gì",
      noiDung: (
        <>
          <p>Hiểu Bản Thân đưa năm hệ thống văn hoá phương Đông và phương Tây (thần số học, Tử vi, Bát tự, Kinh Dịch,
            Phong thuỷ) về một nơi. Cách trình bày dễ hiểu, minh bạch về cách tính, và không phán xét.</p>
          <p>Mục tiêu không phải đoán trước tương lai, mà là cho bạn thêm một tấm gương để nhìn lại tính cách, nhịp
            sống và các lựa chọn của mình.</p>
        </>
      ),
    },
    {
      id: "phuong-phap", tieuDe: "Hệ thống tính như thế nào",
      noiDung: (
        <Bang dau={["Tầng", "Làm gì", "Có dùng AI?"]} dong={[
          [<b key="1">1. Tính toán</b>, "Con số, an sao, tứ trụ theo tiết khí, gieo quẻ, đổi độ ra hướng. Cùng đầu vào luôn ra cùng kết quả, có bộ dữ liệu đối chiếu.", "Không"],
          [<b key="2">2. Kho tri thức</b>, "Nghĩa của số, sao, quẻ, cung… Mỗi mục ghi nguồn và trường phái.", "Nháp do AI soạn, có nhãn, duyệt dần"],
          [<b key="3">3. Quy tắc luận</b>, "Ghép các lớp theo thứ tự ưu tiên (ví dụ đại hạn > lưu niên > tiểu hạn > lưu nguyệt).", "Không"],
          [<b key="4">4. Diễn đạt</b>, "Viết thành câu dễ đọc từ dữ liệu tầng 1–3.", "Có thể. Cấm thêm dữ kiện, có kiểm tra tự động"],
        ]} />
      ),
    },
    {
      id: "nguon", tieuDe: "Nguồn tri thức và mã nguồn mở",
      noiDung: (
        <>
          <Bang dau={["Thành phần", "Dùng vào", "Giấy phép / ghi chú"]} dong={[
            ["iztro (SylarLong)", "An sao Tử vi, chạy ngay trên máy chủ của chúng tôi", "MIT"],
            ["Thuật toán âm lịch Hồ Ngọc Đức", "Đổi âm – dương lịch theo múi giờ Việt Nam (gồm miền Nam 1960–1975)", "Thuật toán công bố"],
            ["lasotuvi (doanguyen)", "Đối chiếu độ sáng sao, Hoả Linh, vòng Thái Tuế lối Việt", "MIT, chỉ dùng để đối chiếu"],
            ["lunar-typescript", "Sinh bộ dữ liệu đối chiếu tiết khí, can chi", "Chỉ dùng để đối chiếu, không chạy thật"],
            ["VSOP87 rút gọn", "Tính tiết khí cho Bát tự (sai số ≤ 1 phút)", "Mô hình thiên văn công bố"],
            ["TuViMCP", "Danh mục cách cục Tử vi để đối chiếu", "MIT"],
            ["Cổ thư (ctext.org)", "Nguyên văn Kinh Dịch, Tử Vi Đẩu Số Toàn Thư, Tử Bình Chân Thuyên…", "Phạm vi công cộng"],
            ["Sách hiện đại", "Chỉ tóm ý, ghi nguồn", "Không chép nguyên văn"],
          ]} />
          <p>Chúng tôi <b>không</b> chép mã hay dữ liệu từ dự án mang giấy phép GPL/AGPL, hoặc từ dự án không có giấy phép.</p>
        </>
      ),
    },
    {
      id: "cam-ket", tieuDe: "Cam kết",
      noiDung: (
        <ul>
          <li>Minh bạch trường phái: luôn ghi rõ đang tính theo phái nào, và cho bạn chuyển sang phái khác để so.</li>
          <li>Tôn trọng dữ liệu: hồ sơ mặc định chỉ nằm trên máy bạn. Xem <Link href="/chinh-sach-rieng-tu" className="text-gold underline">Chính sách quyền riêng tư</Link>.</li>
          <li>Không gây sợ hãi: không phán bệnh tật, tai nạn hay sống chết, không bán "giải hạn".</li>
          <li>Sẵn sàng sửa sai: phát hiện lỗi tính hay lỗi nội dung, xin báo qua trang <Link href="/lien-he" className="text-gold underline">Liên hệ</Link>.</li>
        </ul>
      ),
    },
    ...(vh.chuSoHuu ? [{
      id: "van-hanh", tieuDe: "Đơn vị vận hành",
      noiDung: <p>{vh.chuSoHuu}{vh.maSo ? ` · Mã số ${vh.maSo}` : ""}{vh.diaChi ? ` · ${vh.diaChi}` : ""}.</p>,
    }] : []),
  ];
  return (
    <TrangPhapLy nhan="Về chúng tôi" tieuDe="Giới thiệu & phương pháp" duongDan="/gioi-thieu" muc={muc} hieuLuc={false}
      moDau={<p>Một nơi để hiểu mình hơn qua những hệ thống văn hoá lâu đời, với cách tính minh bạch, nguồn rõ ràng
        và tôn trọng quyền riêng tư.</p>} />
  );
}
