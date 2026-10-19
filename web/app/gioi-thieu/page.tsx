// PL-1 — Giới thiệu & phương pháp: sứ mệnh, cách làm, ai biên soạn/thẩm định, nguồn tri thức (sách), cam kết.
// BM-1 (chủ dự án 2026-10-09): KHÔNG nêu kiến trúc, thư viện, bộ đối chiếu, nhà cung cấp — bí mật kinh doanh. Danh mục
// thành phần mã nguồn mở + giấy phép giữ nội bộ ở docs/NGUON-MO.md (giấy phép MIT không bắt buộc công bố khi chỉ chạy
// trên máy chủ, nhưng vẫn giữ ghi công trong repo).
import type { Metadata } from "next";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { gopMucCms, LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import Link from "next/link";
import { Bang, TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { vanHanh } from "@/lib/van-hanh";
import { coUngHo } from "@/lib/ung-ho";

const META: Metadata = {
  title: "Giới thiệu & phương pháp",
  description: "Hiểu Bản Thân là gì, làm việc ra sao, ai biên soạn và thẩm định, kho tri thức dựa trên những cổ thư nào.",
  alternates: { canonical: "/gioi-thieu" },
};

const DUONG = "/gioi-thieu";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function GioiThieu() {
  const vh = vanHanh(), nd = await layNoiDungTrang(DUONG);
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
      id: "phuong-phap", tieuDe: "Cách chúng tôi làm",
      noiDung: (
        <ul>
          <li><b>Tính toán chính xác, nhất quán.</b> Con số, lá số Tử vi, tứ trụ Bát tự, quẻ Kinh Dịch và hướng nhà do hệ
            thống tính toán riêng của Hiểu Bản Thân thực hiện. Cùng thông tin luôn cho cùng kết quả, và đã được đối chiếu
            với hàng trăm lá số mẫu trước khi đưa lên.</li>
          <li><b>Theo âm lịch Việt Nam.</b> Ngày giờ sinh được đổi theo âm lịch và múi giờ Việt Nam (kể cả các giai đoạn
            lịch sử đổi múi giờ), mặc định theo lối luận phổ biến ở Việt Nam, có công tắc để so với phái khác.</li>
          <li><b>Diễn giải có nguồn.</b> Phần luận giải lấy từ kho tri thức do ban biên tập biên soạn, mỗi mục ghi nguồn
            và trường phái. Kho tri thức chỉ diễn giải kết quả đã tính, không thêm lời phán.</li>
        </ul>
      ),
    },
    {
      id: "quy-trinh", tieuDe: "Ai biên soạn, ai thẩm định",
      noiDung: (
        <>
          <p>Chủ biên nội dung là <Link href="/tac-gia/duc-luan" className="text-gold underline">Đức Luân</Link> — người sáng
            lập, hơn 15 năm nghiên cứu thần số học, Tử vi, Bát tự, Phong thuỷ và Kinh Dịch. Anh tự biên soạn phần ý nghĩa
            12 con số thần số học, đặt quy tắc biên tập và chọn trường phái mặc định cho toàn site.</p>
          <p>Ban biên tập Hiểu Bản Thân biên soạn phần diễn giải từ cổ thư và tài liệu tham khảo theo quy tắc đó. Chủ biên
            đọc, sửa và <b>thẩm định từng bài</b>; bài đã thẩm định ghi tên người thẩm định và ngày.</p>
        </>
      ),
    },
    {
      id: "nguon", tieuDe: "Nguồn tri thức",
      noiDung: (
        <>
          <Bang dau={["Môn", "Sách và trường phái tham khảo"]} dong={[
            ["Kinh Dịch", "Chu Dịch (Kinh và Thập Dực), Mai Hoa Dịch Số (Thiệu Ung), Tăng San Bốc Dịch (Dã Hạc Lão Nhân)"],
            ["Tử vi", "Tử Vi Đẩu Số Toàn Thư, Đẩu Số Cốt Tuỷ Phú; Tử vi Nam phái lối Việt"],
            ["Bát tự", "Uyên Hải Tử Bình, Tử Bình Chân Thuyên, Trích Thiên Tuỷ, Tam Mệnh Thông Hội"],
            ["Phong thuỷ", "Dương Trạch Tam Yếu (Bát trạch), Thẩm Thị Huyền Không Học, Táng Thư, Hám Long Kinh"],
            ["Thần số học", "Thần số học Pythagoras hiện đại và các sách thần số phổ biến"],
          ]} />
          <p>Cổ thư chúng tôi dùng nguyên văn thuộc phạm vi công cộng. Sách hiện đại chỉ tóm ý và ghi nguồn, không chép
            nguyên văn.</p>
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
    ...(coUngHo() ? [{
      id: "ung-ho", tieuDe: "Ủng hộ đội ngũ",
      noiDung: <p>Phần lớn công cụ miễn phí và do một nhóm nhỏ phát triển. Nếu thấy hữu ích, bạn có thể <Link href="/ung-ho" className="text-gold underline">ủng hộ đội ngũ</Link> (quà tặng tự nguyện, không kèm quyền lợi).</p>,
    }] : []),
    ...(vh.chuSoHuu ? [{
      id: "van-hanh", tieuDe: "Đơn vị vận hành",
      noiDung: <p>{vh.chuSoHuu}{vh.maSo ? ` · Mã số ${vh.maSo}` : ""}{vh.diaChi ? ` · ${vh.diaChi}` : ""}.</p>,
    }] : []),
  ];
  return (
    <TrangPhapLy nhan="Về chúng tôi" tieuDe={nd.dau.h1 ?? "Giới thiệu & phương pháp"} duongDan={DUONG} muc={gopMucCms(muc, nd)} hieuLuc={false}
      khoiCuoi={<KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />}
      moDau={<LoiDanCms nd={nd}>Một nơi để hiểu mình hơn qua những hệ thống văn hoá lâu đời, với cách tính minh bạch, nguồn rõ ràng
        và tôn trọng quyền riêng tư.</LoiDanCms>} />
  );
}
