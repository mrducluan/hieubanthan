// PL-1 — Điều khoản sử dụng. Khớp quyết định đã chốt: Sao là credit nội bộ (không đổi tiền, không chuyển nhượng,
// thưởng mời một tầng), nội dung do ban biên tập biên soạn (BM-1: không gắn nhãn AI trên bài), không phán bệnh/sống chết/xổ số.
import type { Metadata } from "next";
import Link from "next/link";
import { TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { DANG_CAP_NHAT, vanHanh } from "@/lib/van-hanh";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng Hiểu Bản Thân: tính chất dịch vụ tham khảo văn hoá, tài khoản, Sao, nội dung, sở hữu trí tuệ và giới hạn trách nhiệm.",
  alternates: { canonical: "/dieu-khoan" },
};

export default function DieuKhoan() {
  const vh = vanHanh();
  const muc: Muc[] = [
    {
      id: "chap-nhan", tieuDe: "Chấp nhận điều khoản",
      noiDung: <p>Khi dùng Hiểu Bản Thân, bạn đồng ý với các điều khoản này và với{" "}
        <Link href="/chinh-sach-rieng-tu" className="text-gold underline">Chính sách quyền riêng tư</Link>. Nếu không đồng ý,
        vui lòng ngừng sử dụng. Dịch vụ do {vh.chuSoHuu ?? `đơn vị vận hành (${DANG_CAP_NHAT})`} cung cấp.</p>,
    },
    {
      id: "tinh-chat", tieuDe: "Tính chất của dịch vụ",
      noiDung: (
        <>
          <p>Hiểu Bản Thân giới thiệu thần số học, Tử vi, Bát tự, Kinh Dịch và Phong thuỷ như <b>di sản văn hoá để
            tham khảo và tự suy ngẫm</b>, không phải khoa học dự báo.</p>
          <ul>
            <li>Phần <b>tính toán</b> (con số, lá số, quẻ, hướng) do hệ thống tính toán riêng thực hiện, cùng đầu vào cho cùng kết quả.</li>
            <li>Phần <b>diễn giải</b> lấy từ kho tri thức do Ban biên tập Hiểu Bản Thân biên soạn từ thư tịch cổ và sách tham khảo. Hỏi đáp có thể dùng công cụ diễn đạt tự động; xem <Link href="/mien-tru-trach-nhiem#noi-dung" className="text-gold underline">Miễn trừ trách nhiệm</Link>.</li>
            <li>Kết quả <b>không phải</b> lời khuyên y tế, tâm lý, pháp lý, tài chính, đầu tư hay tuyển dụng. Đừng dùng nó để thay thế ý kiến của người có chuyên môn.</li>
          </ul>
        </>
      ),
    },
    {
      id: "tai-khoan", tieuDe: "Tài khoản",
      noiDung: (
        <ul>
          <li>Bạn dùng được phần lớn tính năng mà không cần tài khoản. Tài khoản chỉ để lưu hồ sơ và ví Sao.</li>
          <li>Bạn chịu trách nhiệm giữ an toàn email, số điện thoại hoặc tài khoản Google dùng để đăng nhập.</li>
          <li>Bạn xoá được tài khoản bất cứ lúc nào ở mục Tài khoản. Hồ sơ, ví Sao và mã mời sẽ bị xoá theo.</li>
          <li>Chúng tôi có thể tạm khoá tài khoản vi phạm mục 5.</li>
        </ul>
      ),
    },
    {
      id: "sao", tieuDe: "Sao — điểm dùng trong ứng dụng",
      noiDung: (
        <ul>
          <li>Sao là <b>điểm dùng nội bộ</b> để mở một số tính năng (ví dụ Luận giải toàn bộ).</li>
          <li>Sao <b>không có giá trị tiền tệ</b>. Sao không đổi ra tiền, không rút, không chuyển nhượng hay mua bán giữa người dùng, và không phải tài sản mã hoá.</li>
          <li>Thưởng mời bạn bè chỉ có <b>một tầng</b> (người mời và người được mời). Không có hoa hồng nhiều tầng.</li>
          <li>Sao tặng có thể có hạn dùng (ghi rõ khi tặng). Sao bị huỷ khi xoá tài khoản.</li>
          <li><b>Mua Sao</b> (trang Nạp Sao): giá ghi bằng đồng, trả một lần qua chuyển khoản QR, không tự gia hạn. Sao mua không hết hạn.</li>
          <li><b>Hoàn tiền:</b> nạp nhầm gói hoặc nạp trùng mà chưa dùng số Sao đó, gửi mã đơn qua trang Liên hệ trong 7 ngày → hoàn qua chuyển khoản, Sao của đơn bị trừ lại. Lỗi hệ thống (đã trả tiền mà không nhận Sao) được cộng bù hoặc hoàn tiền.</li>
          <li>Chúng tôi không lưu số thẻ hay thông tin tài khoản ngân hàng của bạn; cổng thanh toán xử lý việc đó.</li>
        </ul>
      ),
    },
    {
      id: "hanh-vi", tieuDe: "Những điều không được làm",
      noiDung: (
        <ul>
          <li>Nhập ngày sinh, thông tin của người khác khi họ không biết hoặc không đồng ý, rồi dùng kết quả để gây hại, phân biệt đối xử hay bêu riếu họ.</li>
          <li>Dùng kết quả để quyết định tuyển dụng, cho vay, hôn nhân thay người khác, hoặc để đe doạ, lừa đảo, hành nghề mê tín dị đoan.</li>
          <li>Thu thập tự động (bot, crawl) khối lượng lớn ngoài phạm vi robots.txt; tấn công, dò lỗi, làm quá tải hệ thống.</li>
          <li>Lách cơ chế Sao (tạo tài khoản ảo để nhận thưởng mời…).</li>
        </ul>
      ),
    },
    {
      id: "noi-dung", tieuDe: "Nội dung và sở hữu trí tuệ",
      noiDung: (
        <>
          <p>Giao diện, mã nguồn, cách trình bày và phần biên soạn nội dung thuộc đơn vị vận hành.</p>
          <p>Văn bản cổ thư (Kinh Dịch, Tử Vi Đẩu Số Toàn Thư…) thuộc phạm vi công cộng. Sách hiện đại chỉ được
            tóm ý và ghi nguồn, không chép nguyên văn.</p>
          <p>Hệ thống tính toán, cách tổ chức kho tri thức, quy tắc luận giải và dữ liệu đối chiếu là bí mật kinh doanh của
            đơn vị vận hành.</p>
          <p>Bạn được chia sẻ kết quả cá nhân của mình, kèm dẫn nguồn. Khi chưa có sự đồng ý bằng văn bản, bạn không được:
            sao chép hàng loạt nội dung thư viện kiến thức để đăng lại; dùng công cụ tự động để thu thập dữ liệu hoặc gọi
            hàng loạt các chức năng tính toán; tìm cách dò ngược cách hệ thống tính toán; dùng nội dung hay kết quả để xây
            dựng dịch vụ cạnh tranh.</p>
        </>
      ),
    },
    {
      id: "trach-nhiem", tieuDe: "Giới hạn trách nhiệm",
      noiDung: (
        <>
          <p>Dịch vụ được cung cấp "như hiện có". Chúng tôi cố gắng tính đúng và kiểm thử kỹ, nhưng không bảo đảm dịch
            vụ không gián đoạn hay không có sai sót.</p>
          <p>Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm về quyết định bạn đưa ra dựa trên nội
            dung tham khảo này. Điều khoản này không loại trừ những trách nhiệm mà pháp luật Việt Nam không cho phép
            loại trừ.</p>
        </>
      ),
    },
    {
      id: "luat", tieuDe: "Luật áp dụng, thay đổi và liên hệ",
      noiDung: (
        <p>Điều khoản này áp dụng pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không
          thành thì đưa ra cơ quan có thẩm quyền tại Việt Nam. Khi điều khoản thay đổi, chúng tôi cập nhật ngày hiệu
          lực và báo trên web. Mọi thắc mắc xin gửi qua trang <Link href="/lien-he" className="text-gold underline">Liên hệ</Link>.</p>
      ),
    },
  ];
  return (
    <TrangPhapLy nhan="Pháp lý" tieuDe="Điều khoản sử dụng" duongDan="/dieu-khoan" muc={muc}
      moDau={<p>Các điều khoản dưới đây áp dụng khi bạn dùng web Hiểu Bản Thân, có hoặc không có tài khoản.</p>} />
  );
}
