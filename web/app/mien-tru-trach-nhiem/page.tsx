// PL-1 — Miễn trừ trách nhiệm & nguyên tắc nội dung (khớp các chặn cứng trong engine: khủng hoảng, ngày chết,
// chẩn đoán bệnh, xổ số, tuyển dụng — app/hoidap/chung.py, thanso_xu_ly.json).
import type { Metadata } from "next";
import { gopMucCms, LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang, ngayHienThi } from "@/lib/noi-dung-trang";
import Link from "next/link";
import { TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";

const META: Metadata = {
  title: "Miễn trừ trách nhiệm",
  description: "Hiểu Bản Thân là góc nhìn văn hoá để tự suy ngẫm — không dự báo, không thay thế bác sĩ, luật sư, chuyên gia tài chính hay tâm lý.",
  alternates: { canonical: "/mien-tru-trach-nhiem" },
};

const DUONG = "/mien-tru-trach-nhiem";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

// ND-4: tiêu đề, lời mở đầu, từng mục (theo neo) và ngày hiệu lực sửa được ở CMS — chỉ Quản trị/Chủ biên, phải tích
// "đã đối chiếu" mỗi lần xuất bản. Ô trống / gỡ xuất bản → chữ trong file này.
export default async function MienTru() {
  const nd = await layNoiDungTrang(DUONG);
  const muc: Muc[] = [
    {
      id: "tham-khao", tieuDe: "Góc nhìn tham khảo, không phải lời tiên đoán",
      noiDung: (
        <p>Thần số học, Tử vi, Bát tự, Kinh Dịch và Phong thuỷ là những hệ thống văn hoá có lịch sử lâu đời, nhưng
          <b> chưa được khoa học kiểm chứng là dự báo được tương lai</b>. Chúng tôi trình bày chúng như những lăng kính để
          bạn nhìn lại chính mình. Mỗi bài đọc luôn tách ba lớp: <b>Đã tính</b> (máy tính theo công thức),{" "}
          <b>Diễn giải</b> (theo kho tri thức) và <b>Tự soi</b> (câu hỏi dành cho bạn).</p>
      ),
    },
    {
      id: "khong-tra-loi", tieuDe: "Những điều hệ thống không trả lời",
      noiDung: (
        <ul>
          <li>Ngày mất, tuổi thọ, tai nạn, chẩn đoán hay tiên lượng bệnh.</li>
          <li>Số xổ số, cá cược, mã chứng khoán, thời điểm mua bán tài sản.</li>
          <li>Có nên tuyển, cho thôi việc, cho vay hay kết hôn với một người cụ thể dựa trên ngày sinh của họ.</li>
          <li>Chấm điểm "hợp – khắc" để quyết định một mối quan hệ. Phần hợp đôi chỉ mô tả cách hai người khác nhau.</li>
        </ul>
      ),
    },
    {
      id: "khung-hoang", tieuDe: "Khi bạn đang khủng hoảng",
      noiDung: (
        <p className="rounded-xl border border-cinnabar/40 bg-cinnabar/10 px-4 py-3 text-fg">
          Không con số, lá số hay quẻ nào quyết định được giá trị đời bạn. Nếu bạn đang nghĩ tới việc làm hại bản thân
          hoặc đang gặp nguy hiểm, hãy gọi ngay <b>115</b> (cấp cứu) hoặc <b>113</b> (công an). Nếu việc liên quan tới trẻ em,
          gọi <b>111</b>. Hãy nói chuyện với một người bạn tin tưởng hoặc chuyên gia tâm lý ngay hôm nay.
        </p>
      ),
    },
    {
      id: "noi-dung", tieuDe: "Nội dung được làm ra thế nào",
      noiDung: (
        <ul>
          <li><b>Tính toán</b> (con số, an sao, tứ trụ, gieo quẻ, đổi hướng) do hệ thống tính toán riêng của Hiểu Bản Thân thực hiện: cùng thông tin luôn cho cùng kết quả, đã đối chiếu với các lá số mẫu.</li>
          <li><b>Diễn giải</b> do Ban biên tập Hiểu Bản Thân biên soạn từ cổ thư và sách tham khảo, chủ biên Đức Luân chịu trách nhiệm. Bài đã được chuyên gia thẩm định ghi tên người thẩm định và ngày.</li>
          <li><b>Hỏi đáp và luận giải</b> có thể dùng công cụ diễn đạt tự động (AI) để viết lại kết quả đã tính cho dễ đọc. Công cụ này chỉ được viết lại dữ liệu đã có; một lớp kiểm tra tự động chặn câu trả lời có con số lạ hoặc giọng phán quyết, và trả về bản gốc nếu bị chặn.</li>
        </ul>
      ),
    },
    {
      id: "truong-phai", tieuDe: "Trường phái khác nhau",
      noiDung: <p>Các môn này có nhiều trường phái bất đồng thật sự (cách tính giờ Tý, lịch Việt hay Trung, Hoả Linh, tháng hạn…).
        Hệ thống <b>không âm thầm chọn giùm</b> bạn: mặc định theo lối phổ biến ở Việt Nam, có công tắc để so sánh, và ghi rõ đang
        dùng phái nào. Hai trang khác nhau có thể ra kết quả khác nhau mà cả hai đều "đúng phái" của mình.</p>,
    },
    {
      id: "trach-nhiem", tieuDe: "Quyết định là của bạn",
      noiDung: <p>Bạn tự chịu trách nhiệm về các quyết định của mình. Với vấn đề sức khoẻ, pháp lý, tài chính hay tâm lý, hãy hỏi
        người có chuyên môn. Xem thêm <Link href="/dieu-khoan#trach-nhiem" className="text-gold underline">Giới hạn trách nhiệm</Link>.</p>,
    },
  ];
  return (
    <TrangPhapLy nhan="Pháp lý" tieuDe={nd.dau.h1 ?? "Miễn trừ trách nhiệm"} duongDan={DUONG} muc={gopMucCms(muc, nd)}
      ngayHieuLuc={ngayHienThi(nd.ngayHieuLuc)}
      moDau={<LoiDanCms nd={nd}>Đọc trang này một lần để biết Hiểu Bản Thân làm được gì và cố ý không làm gì.</LoiDanCms>} />
  );
}
