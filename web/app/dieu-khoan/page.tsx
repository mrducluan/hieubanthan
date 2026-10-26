// PL-1 — Điều khoản sử dụng. Khớp quyết định đã chốt: Sao là credit nội bộ (không đổi tiền, không chuyển nhượng,
// thưởng mời + hoa hồng giới thiệu một tầng — SAO-V 0025), nội dung do ban biên tập biên soạn (BM-1: không gắn nhãn AI trên bài), không phán bệnh/sống chết/xổ số.
import type { Metadata } from "next";
import { gopMucCms, LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang, ngayHienThi } from "@/lib/noi-dung-trang";
import Link from "next/link";
import { TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { DANG_CAP_NHAT, vanHanh } from "@/lib/van-hanh";
import { HOAN_TIEN_HOI_VIEN } from "@/lib/thanh-toan/hoi-vien";

const META: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng Hiểu Bản Thân: tính chất dịch vụ tham khảo văn hoá, tài khoản, Sao, nội dung, sở hữu trí tuệ và giới hạn trách nhiệm.",
  alternates: { canonical: "/dieu-khoan" },
};

const DUONG = "/dieu-khoan";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

// ND-4: tiêu đề, lời mở đầu, từng mục (theo neo) và ngày hiệu lực sửa được ở CMS — chỉ Quản trị/Chủ biên, phải tích
// "đã đối chiếu" mỗi lần xuất bản. Ô trống / gỡ xuất bản → chữ trong file này.
export default async function DieuKhoan() {
  const nd = await layNoiDungTrang(DUONG);
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
          <li>Chúng tôi có thể tạm khoá tài khoản vi phạm mục <Link href="#hanh-vi" className="text-gold underline">Những điều không được làm</Link>.</li>
        </ul>
      ),
    },
    {
      id: "sao", tieuDe: "Sao — điểm dùng trong ứng dụng",
      noiDung: (
        <ul>
          <li>Sao là <b>điểm dùng nội bộ</b> để mở một số tính năng (ví dụ Luận giải toàn bộ).</li>
          <li>Sao <b>không có giá trị tiền tệ</b>. Sao không đổi ra tiền, không rút, không chuyển nhượng hay mua bán giữa người dùng, và không phải tài sản mã hoá.</li>
          <li>Có hai loại Sao trong ví: <b>Sao mua</b> (bạn nạp bằng tiền) <b>không bao giờ hết hạn</b>; <b>Sao tặng</b> (chào mừng, mời bạn, hoa hồng giới thiệu, nhiệm vụ, chuỗi ngày ghé…) có hạn <b>365 ngày</b> kể từ ngày nhận. Khi bạn dùng Sao, Sao tặng sắp hết hạn được trừ trước, Sao mua trừ sau cùng.</li>
          <li>Thưởng mời bạn bè chỉ có <b>một tầng</b> — chi tiết ở mục <Link href="#gioi-thieu" className="text-gold underline">Chương trình giới thiệu</Link>. Không có hoa hồng nhiều tầng.</li>
          <li>Sao bị huỷ khi xoá tài khoản.</li>
          <li><b>Mua Sao</b> (trang Nạp Sao): giá ghi bằng đồng, trả một lần qua chuyển khoản QR, không tự gia hạn. Sao mua không hết hạn.</li>
          <li><b>Tặng lần nạp đầu</b> (khi chương trình đang bật): Sao cộng thêm cho lần nạp đầu tiên là <b>Sao tặng</b> (hạn 365 ngày), chỉ một lần mỗi tài khoản, và bị thu hồi nếu đơn nạp đầu đó được hoàn tiền.</li>
          <li><b>Hoàn tiền:</b> nạp nhầm gói hoặc nạp trùng mà chưa dùng số Sao đó, gửi mã đơn qua trang Liên hệ trong 7 ngày → hoàn qua chuyển khoản, Sao của đơn bị trừ lại. Lỗi hệ thống (đã trả tiền mà không nhận Sao) được cộng bù hoặc hoàn tiền.</li>
          <li>Chúng tôi không lưu số thẻ hay thông tin tài khoản ngân hàng của bạn; cổng thanh toán xử lý việc đó.</li>
        </ul>
      ),
    },
    {
      id: "hoi-vien", tieuDe: "Hội viên năm",
      noiDung: (
        <ul>
          <li><b>Hội viên năm</b> (khi đang mở bán) là gói trả <b>một lần</b> bằng đồng, có hiệu lực 365 ngày kể từ ngày thanh
            toán thành công. <b>Không tự gia hạn</b>, không trừ tiền định kỳ; hết hạn bạn tự quyết có gia hạn hay không (gia hạn
            mở khi còn 30 ngày trở xuống và nối tiếp hạn hiện tại).</li>
          <li><b>Quyền lợi</b> trong thời hạn: mở mọi chương Luận giải toàn bộ (Tử vi, Bát tự, Bản đồ con số) không trừ Sao; một
            số Sao tặng mỗi tháng theo mức đang công bố — cấp một lần mỗi tháng, dùng trong tháng đó, <b>không cộng dồn</b>; và
            một số lượt hỏi chuyên gia mỗi năm theo mức đang công bố (dùng khi mục đó mở; lượt chưa dùng không cộng dồn sang năm
            sau). Mức cụ thể ghi trên trang Hội viên lúc mua; thay đổi mức sau đó không làm giảm quyền lợi của thời hạn đã mua.</li>
          <li>Hội viên gắn với tài khoản, không chuyển nhượng. Sao vẫn là điểm dùng nội bộ như mục <Link href="#sao" className="text-gold underline">Sao</Link>.</li>
          <li><b>Hoàn tiền hội viên:</b>
            <ul>{HOAN_TIEN_HOI_VIEN.map((t) => <li key={t}>{t}</li>)}</ul>
            Sau khi hoàn, quyền hội viên chấm dứt ngay; Sao bạn đã mua riêng vẫn giữ nguyên.</li>
        </ul>
      ),
    },
    {
      id: "gioi-thieu", tieuDe: "Chương trình giới thiệu (mời bạn)",
      noiDung: (
        <ul>
          <li><b>Một tầng:</b> chỉ người mời trực tiếp và người được mời nhận thưởng. Người bạn của bạn mời thêm ai khác thì bạn
            không nhận gì từ đó.</li>
          <li><b>Thưởng mời:</b> khi bạn bè mở link mời của bạn, đăng nhập và lưu hồ sơ vào tài khoản, cả hai được cộng Sao tặng
            theo mức đang công bố trong ví Sao. Mỗi tài khoản chỉ được tính là "người được mời" một lần; hai người không mời
            qua lại lẫn nhau để cùng nhận thưởng.</li>
          <li><b>Hoa hồng giới thiệu</b> (khi chương trình đang bật): khi bạn bè do chính bạn mời nạp Sao bằng tiền, bạn nhận
            một tỉ lệ phần trăm số Sao của (các) đơn nạp đầu tiên của bạn ấy, trong một thời hạn tính từ lúc bạn ấy nhận lời
            mời. Tỉ lệ, số đơn và thời hạn đang áp dụng ghi trong ví Sao. Hoa hồng trả bằng Sao tặng, <b>không trừ gì</b> của
            người nạp. Đơn bị hoàn tiền thì hoa hồng của đơn đó được thu hồi.</li>
          <li>Mọi phần thưởng của chương trình là <b>Sao — điểm dùng nội bộ</b>: không đổi ra tiền, không rút, không chuyển
            nhượng. Bạn chỉ thấy ngày và số Sao nhận được, không thấy ai nạp hay nạp bao nhiêu tiền.</li>
          <li><b>Trần chống lạm dụng:</b> có giới hạn số lượt thưởng mời và số Sao hoa hồng mỗi người trong 30 ngày. Vượt trần
            thì phần vượt không được cộng.</li>
          <li>Chúng tôi có quyền điều chỉnh mức thưởng, tỉ lệ, trần, hoặc tạm dừng / chấm dứt chương trình, và sẽ báo trên web.
            Sao đã cộng trước khi thay đổi vẫn giữ nguyên.</li>
          <li><b>Gian lận</b> (tài khoản ảo, tự mời mình, mua rồi hoàn tiền để lấy hoa hồng, dùng công cụ tự động…) → Sao thưởng
            liên quan bị thu hồi và tài khoản có thể bị tạm khoá.</li>
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
          <li>Lách cơ chế Sao (tạo tài khoản ảo để nhận thưởng mời hay hoa hồng giới thiệu…).</li>
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
    <TrangPhapLy nhan="Pháp lý" tieuDe={nd.dau.h1 ?? "Điều khoản sử dụng"} duongDan={DUONG} muc={gopMucCms(muc, nd)}
      ngayHieuLuc={ngayHienThi(nd.ngayHieuLuc)}
      moDau={<LoiDanCms nd={nd}>Các điều khoản dưới đây áp dụng khi bạn dùng web Hiểu Bản Thân, có hoặc không có tài khoản.</LoiDanCms>} />
  );
}
