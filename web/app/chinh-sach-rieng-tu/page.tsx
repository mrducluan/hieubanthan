// PL-1 — Chính sách quyền riêng tư & bảo vệ dữ liệu cá nhân. Viết theo ĐÚNG những gì hệ thống đang làm
// (rà mã 2026-10-08: web/lib/hoso.ts, lib/do-luong.ts, engine/app/nhat_ky.py, narrative/hoi_van.py, migrations 0006–0008).
// Sửa cách xử lý dữ liệu ở đâu → sửa trang này + NGAY_HIEU_LUC trong lib/van-hanh.ts.
// BM-1 (chủ dự án 2026-10-09): ghi NHÓM nhà cung cấp, không ghi tên dịch vụ hạ tầng / tên khoá lưu trữ nội bộ; danh sách
// cụ thể cung cấp khi người dùng hỏi (giữ trong docs/BAO-MAT.md). Google Analytics giữ tên vì liên quan hộp hỏi cookie.
import type { Metadata } from "next";
import { gopMucCms, LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang, ngayHienThi } from "@/lib/noi-dung-trang";
import Link from "next/link";
import { Bang, TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { DANG_CAP_NHAT, vanHanh } from "@/lib/van-hanh";

const META: Metadata = {
  title: "Chính sách quyền riêng tư",
  description: "Hiểu Bản Thân thu gì, lưu ở đâu, bao lâu, gửi cho ai và bạn có quyền gì với dữ liệu cá nhân của mình — theo Luật Bảo vệ dữ liệu cá nhân 2025.",
  alternates: { canonical: "/chinh-sach-rieng-tu" },
};

const DUONG = "/chinh-sach-rieng-tu";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

// ND-4: tiêu đề, lời mở đầu, từng mục (theo neo) và ngày hiệu lực sửa được ở CMS — chỉ Quản trị/Chủ biên, phải tích
// "đã đối chiếu" mỗi lần xuất bản. Ô trống / gỡ xuất bản → chữ trong file này.
export default async function ChinhSachRiengTu() {
  const nd = await layNoiDungTrang(DUONG);
  const vh = vanHanh();
  const lienHe = vh.emailDuLieu
    ? <a href={`mailto:${vh.emailDuLieu}`} className="text-gold underline">{vh.emailDuLieu}</a>
    : <span>email liên hệ ({DANG_CAP_NHAT})</span>;

  const muc: Muc[] = [
    {
      id: "tom-tat", tieuDe: "Tóm tắt trong 30 giây",
      noiDung: (
        <ul>
          <li><b>Mặc định, hồ sơ của bạn chỉ nằm trên máy bạn.</b> Máy chủ chỉ dùng ngày giờ sinh để tính rồi bỏ, không lưu lại.</li>
          <li>Chỉ khi bạn <b>chủ động bấm lưu vào tài khoản</b>, hồ sơ mới được lưu trên máy chủ. Chỉ bạn đọc được, và bạn xoá được bất cứ lúc nào.</li>
          <li>Chúng tôi <b>không lưu nội dung luận giải gắn với tài khoản</b>, không lưu ảnh của bạn (ảnh nhà bạn chọn "để máy đọc" chỉ đi qua lượt gọi khi bạn tự tích đồng ý), <b>không bán dữ liệu</b>, không dùng dữ liệu để quảng cáo nhắm mục tiêu.</li>
          <li>Dịch vụ diễn đạt tự động (AI) của bên thứ ba chỉ nhận câu hỏi và các kết quả đã tính, <b>không nhận họ tên hay ngày giờ sinh</b>.</li>
        </ul>
      ),
    },
    {
      id: "ben-kiem-soat", tieuDe: "Ai chịu trách nhiệm về dữ liệu",
      noiDung: (
        <>
          <p>Bên kiểm soát và xử lý dữ liệu cá nhân là đơn vị vận hành Hiểu Bản Thân:</p>
          <ul>
            <li>Tên: {vh.chuSoHuu ?? DANG_CAP_NHAT}</li>
            <li>Mã số: {vh.maSo ?? DANG_CAP_NHAT}{vh.noiCap ? ` — ${vh.noiCap}` : ""}</li>
            <li>Địa chỉ: {vh.diaChi ?? DANG_CAP_NHAT}</li>
            <li>Liên hệ về dữ liệu cá nhân: {lienHe}</li>
          </ul>
          <p>Chính sách này áp dụng Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026) và Nghị định 356/2025/NĐ-CP.</p>
        </>
      ),
    },
    {
      id: "du-lieu", tieuDe: "Dữ liệu nào, lưu ở đâu, bao lâu",
      noiDung: (
        <>
          <Bang dau={["Dữ liệu", "Khi nào", "Lưu ở đâu", "Bao lâu"]} dong={[
            [<b key="a">Hồ sơ trên máy</b>, "Bạn nhập họ tên, ngày giờ sinh, giới tính, nơi sinh", "Chỉ trong trình duyệt của bạn", "Đến khi bạn xoá hồ sơ hoặc xoá dữ liệu trình duyệt"],
            [<b key="b">Dữ liệu gửi để tính</b>, "Mỗi lần xem bài đọc, lá số, hợp đôi", "Máy chủ tính toán xử lý trong bộ nhớ", "Không lưu — bỏ ngay sau khi trả kết quả"],
            [<b key="c">Tài khoản</b>, "Bạn đăng nhập bằng email, Google hoặc số điện thoại", "Máy chủ dữ liệu tại Singapore", "Đến khi bạn xoá tài khoản"],
            [<b key="d">Hồ sơ lưu vào tài khoản</b>, "Chỉ khi bạn bấm lưu", "Máy chủ dữ liệu tại Singapore, chỉ chủ tài khoản đọc được", "Đến khi bạn xoá hồ sơ hoặc tài khoản"],
            [<b key="e">Ví Sao, mã mời</b>, "Khi bạn có tài khoản, mời bạn bè, dùng Sao", "Máy chủ dữ liệu tại Singapore", "Đến khi bạn xoá tài khoản"],
            [<b key="e1">Quan hệ mời</b>, "Khi bạn nhận lời mời của bạn bè (lưu hồ sơ qua link mời): ai mời ai, lúc nào", "Máy chủ dữ liệu tại Singapore — dùng để cộng thưởng mời, chặn mời vòng, tính hoa hồng giới thiệu", "Đến khi một trong hai người xoá tài khoản"],
            [<b key="e2">Đơn nạp Sao và hoa hồng giới thiệu</b>, "Khi bạn nạp Sao: gói, số tiền, số Sao, trạng thái, mã giao dịch của cổng thanh toán. Nếu bạn đến từ lời mời, đơn nạp đầu được dùng để tính hoa hồng cho người mời (ngày, số Sao, trạng thái)", "Máy chủ dữ liệu tại Singapore. Người mời chỉ thấy ngày và số Sao hoa hồng — không thấy bạn là ai, không thấy số tiền", "Đến khi bạn xoá tài khoản (cổng thanh toán có thể giữ chứng từ giao dịch theo luật kế toán)"],
            [<b key="e3">Chuỗi ngày ghé</b>, "Khi đã đăng nhập và mở trang có tính chuỗi", "Máy chủ dữ liệu tại Singapore — CHỈ ngày ghé cuối, độ dài chuỗi hiện tại và dài nhất; không lưu lịch sử từng ngày", "Đến khi bạn xoá tài khoản"],
            [<b key="e4">Quà tặng một chương</b>, "Khi bạn gửi hoặc nhận link quà", "Máy chủ dữ liệu tại Singapore — người gửi, người nhận, mảng, ngày gửi/nhận; người gửi không thấy ai nhận", "Link quà hết hạn sau 7 ngày, chương được mở trong 30 ngày kể từ khi nhận; bản ghi giữ đến khi người gửi hoặc người nhận xoá tài khoản"],
            [<b key="f">Câu hỏi đã lọc</b>, "Khi bạn hỏi đáp (nếu bật nhật ký cải thiện chất lượng)", "Máy chủ dữ liệu tại Singapore", "Tối đa 24 tháng"],
            [<b key="f2">Góp ý "đúng / chưa đúng" cho câu trả lời thần số</b>, "Chỉ khi bạn bấm góp ý; ghi chú chỉ lưu khi bạn tự tích đồng ý", "Máy chủ dữ liệu tại Singapore — chỉ các con số rút gọn của trường phái được góp ý, mã câu hỏi, trường phái và ghi chú đã lọc; không họ tên, ngày sinh hay tài khoản", "Tối đa 12 tháng"],
            [<b key="f3">Điều bạn bấm "Ghi nhớ"</b>, "Chỉ khi đã đăng nhập và bạn bấm Ghi nhớ một câu băn khoăn", "Máy chủ dữ liệu tại Singapore, chỉ chủ tài khoản đọc được; xoá được ngay", "Tối đa 180 ngày"],
            [<b key="f4">Mốc nhắc, thiết bị và tuỳ chọn nhận thông báo</b>, "Chỉ khi đã đăng nhập và bạn bấm \"cả trên tài khoản\" ở một mốc, \"Bật nhắc trên điện thoại\" hoặc tự tích nhận thêm (sáng nay, mốc lịch)", "Máy chủ dữ liệu tại Singapore, chỉ chủ tài khoản đọc được — ngày, nhãn mốc do hệ thống soạn, địa chỉ nhận thông báo của trình duyệt, các ô bạn đã tích; không câu hỏi, không luận giải. Khi bạn bật \"Sáng nay của bạn\", mỗi sáng máy chủ đọc NGÀY và THÁNG sinh trong hồ sơ bạn đã lưu (không năm sinh, không tên) để tính ngày cá nhân, không ghi thêm gì", "Mốc: tối đa 400 ngày; thiết bị và tuỳ chọn: đến khi bạn tắt nhắc, đăng xuất, xoá tài khoản hoặc trình duyệt huỷ đăng ký"],
            [<b key="f5">Ảnh nhà "để máy đọc" (Phong thuỷ)</b>, "Chỉ khi bạn chọn ảnh góc nhà và tự tích đồng ý gửi (ô không tích sẵn)", "Thu nhỏ ngay trên máy bạn (bỏ thông tin máy ảnh, vị trí), đi qua máy chủ tính toán tới nhóm nhà cung cấp mô hình AI để nhận diện dấu hiệu; không lưu ở máy chủ Hiểu Bản Thân, không dùng huấn luyện. Hồ sơ nhà trên máy chỉ giữ mã dấu hiệu bạn đã bấm \"Đúng\", không giữ ảnh", "Không lưu — bỏ ngay sau khi trả gợi ý"],
            [<b key="g">Số liệu sử dụng ẩn danh</b>, "Khi bạn dùng web (nếu bật đo lường)", "Công cụ đo lường ẩn danh", "Tối đa 12 tháng"],
            [<b key="g2">Số liệu truy cập (Google Analytics)</b>, "Khi bạn mở trang (Google Tag Manager). Tắt được ở \"Tuỳ chọn cookie\" chân trang", "Google (qua Google Tag Manager)", "Tối đa 14 tháng"],
            [<b key="h">Báo lỗi kỹ thuật</b>, "Khi trang hoặc máy chủ gặp lỗi (nếu bật)", "Dịch vụ theo dõi lỗi", "Tối đa 90 ngày"],
          ]} />
          <p><b>Địa chỉ IP</b> chỉ được băm (không đảo ngược được) và giữ trong bộ nhớ máy chủ tối đa 24 giờ để giới hạn số lượt
            hỏi đáp mỗi người, không ghi vào đâu.</p>
          <p><b>Góp ý để cải thiện câu trả lời</b>: họ tên và ngày sinh chỉ dùng trong lượt gửi để tính lại các con số, rồi
            bỏ ngay — bảng góp ý chỉ giữ các con số rút gọn của trường phái bạn đang xem (ví dụ "Đường đời 33, Sứ mệnh 9"; rất
            nhiều người có chung các số này), mã câu hỏi và trường phái. Không ai tìm ra bạn từ bảng này nếu không biết sẵn họ
            tên và ngày sinh của bạn. Ghi chú bạn viết chỉ lưu khi bạn tự tích đồng ý, được xoá email, số điện thoại, ngày tháng
            trước khi lưu — xin đừng ghi tên, sức khoẻ hay tôn giáo. Góp ý chỉ dùng để sửa nội dung kho tri thức cho mọi người,
            không dùng vào việc khác, không bán. Dữ liệu quá hạn được xoá tự động mỗi ngày.</p>
          <p><b>Câu hỏi đã lọc</b>: ngày tháng, số điện thoại, email và cụm giống họ tên được xoá trước khi ghi. Câu hỏi
            không gắn với tài khoản hay hồ sơ nào.</p>
          <p><b>Số liệu sử dụng</b> chỉ ghi các bước như mở trang, bắt đầu hay xem xong bài đọc. Hệ thống không ghi ngày
            sinh, tên, câu hỏi, không quay màn hình, không tự bắt mọi cú bấm. <b>Báo lỗi</b> không gửi nội dung yêu
            cầu, cookie, thông tin người dùng hay địa chỉ IP.</p>
          <p><b>Link chia sẻ, thẻ hợp đôi</b> là mã có chữ ký. Mã chỉ chứa tên hiển thị và các con số, không chứa ngày
            sinh, và không lưu trong cơ sở dữ liệu nào.</p>
          <p><b>Ngày sinh của người khác</b> (người yêu, con, đồng nghiệp) bạn nhập để xem hợp đôi chỉ dùng để tính
            rồi bỏ. Vui lòng chỉ nhập khi người đó biết và đồng ý.</p>
        </>
      ),
    },
    {
      id: "muc-dich", tieuDe: "Mục đích và căn cứ xử lý",
      noiDung: (
        <ul>
          <li><b>Tính và hiển thị kết quả bạn yêu cầu</b> (bài đọc thần số, lá số, hợp đôi, quẻ, hướng nhà): căn cứ là yêu cầu của bạn khi bấm xem.</li>
          <li><b>Lưu hồ sơ, tài khoản, ví Sao</b>: căn cứ là sự đồng ý của bạn khi đăng nhập hoặc bấm lưu. Bạn rút lại được bằng cách xoá.</li>
          <li><b>Chương trình giới thiệu, nạp Sao</b>: căn cứ là việc thực hiện điều khoản bạn đã đồng ý (cộng thưởng mời một tầng, hoa hồng giới thiệu, đối soát và hoàn tiền đơn nạp, chống gian lận).</li>
          <li><b>Nhận diện dấu hiệu từ ảnh nhà</b>: căn cứ là ô đồng ý bạn tự tích trước mỗi lần gửi; không tích thì không gửi gì, bạn vẫn tích tay được.</li>
          <li><b>Cải thiện chất lượng</b> (câu hỏi đã lọc, số liệu ẩn danh, báo lỗi): chỉ dùng dữ liệu không nhận diện được bạn.</li>
          <li>Chúng tôi <b>không</b> dùng dữ liệu cho quảng cáo nhắm mục tiêu, <b>không</b> mua bán dữ liệu, <b>không</b> ra quyết định tự động gây ảnh hưởng pháp lý tới bạn.</li>
        </ul>
      ),
    },
    {
      id: "ben-thu-ba", tieuDe: "Bên xử lý thay chúng tôi và chuyển dữ liệu ra nước ngoài",
      noiDung: (
        <>
          <Bang dau={["Nhóm nhà cung cấp", "Việc làm", "Dữ liệu nhận", "Vị trí"]} dong={[
            ["Hạ tầng máy chủ (web và tính toán)", "Chạy trang web và hệ thống tính toán", "Yêu cầu bạn gửi để tính, gồm ngày giờ sinh (không lưu)", "Singapore"],
            ["Cơ sở dữ liệu và đăng nhập", "Tài khoản, hồ sơ đã lưu, ví Sao, quan hệ mời, đơn nạp, câu hỏi đã lọc", "Như mục 3", "Singapore"],
            ["Cổng thanh toán (chuyển khoản QR)", "Tạo mã QR và báo kết quả khi bạn nạp Sao", "Mã đơn, số tiền, nội dung chuyển khoản; không họ tên, ngày sinh. Thông tin tài khoản ngân hàng của bạn do ngân hàng và cổng xử lý, chúng tôi không nhận", "Việt Nam"],
            ["Dịch vụ diễn đạt tự động (AI)", "Diễn đạt câu trả lời hỏi đáp cho dễ đọc (khi bật)", "Câu hỏi bạn gõ + kết quả đã tính; không có họ tên, ngày giờ sinh", "Hoa Kỳ"],
            ["Dịch vụ nhận diện hình ảnh (AI)", "Gợi ý dấu hiệu phong thuỷ nhìn thấy trong ảnh nhà (khi bật, chỉ khi bạn tự tích đồng ý gửi)", "Ảnh góc nhà đã thu nhỏ trên máy bạn + góc chụp, loại nhà bạn chọn; không họ tên, ngày sinh, địa chỉ, toạ độ; không lưu, không dùng huấn luyện", "Hoa Kỳ"],
            ["Đo lường ẩn danh", "Đếm các bước sử dụng (khi bật)", "Sự kiện sử dụng, mã ẩn danh", "Hoa Kỳ hoặc EU"],
            ["Google (Tag Manager, Analytics)", "Đo lượt truy cập — bật mặc định, tắt được ở \"Tuỳ chọn cookie\"", "Trang đã xem, loại thiết bị, mã cookie _ga; không họ tên, ngày giờ sinh", "Hoa Kỳ"],
            ["Dịch vụ thông báo của trình duyệt (Google, Apple, Mozilla, Microsoft)", "Chuyển thông báo nhắc tới thiết bị (chỉ khi bạn bật nhắc)", "Thông báo đã mã hoá đầu-cuối — chỉ thiết bị của bạn đọc được", "Hoa Kỳ hoặc nơi nhà cung cấp đặt máy chủ"],
            ["Theo dõi lỗi kỹ thuật", "Báo lỗi (khi bật)", "Thông tin lỗi kỹ thuật", "Hoa Kỳ hoặc EU"],
          ]} />
          <p>Một số dữ liệu trên được xử lý ngoài Việt Nam. Chúng tôi chỉ dùng nhà cung cấp có cam kết bảo mật bằng
            văn bản, và gửi đi ít dữ liệu nhất có thể. Bạn có thể yêu cầu danh sách tên nhà cung cấp cụ thể qua {lienHe}.
            Câu hỏi gõ vào ô hỏi đáp có thể được gửi nguyên văn cho dịch vụ diễn đạt, vì vậy <b>đừng gõ số điện thoại, địa
            chỉ hay thông tin định danh</b> vào câu hỏi.</p>
        </>
      ),
    },
    {
      id: "quyen", tieuDe: "Quyền của bạn và cách thực hiện",
      noiDung: (
        <>
          <p>Bạn có các quyền: được biết, đồng ý hoặc rút lại đồng ý, xem và lấy bản sao dữ liệu, chỉnh sửa, xoá,
            hạn chế hoặc phản đối việc xử lý, khiếu nại, tố cáo, yêu cầu bồi thường thiệt hại, và tự bảo vệ theo
            quy định pháp luật.</p>
          <ul>
            <li><b>Tự làm ngay trên web</b>:
              <ul>
                <li>sửa hoặc xoá hồ sơ trên máy ở mục Bản thân;</li>
                <li>xoá hồ sơ đã lưu, hoặc <b>xoá hẳn tài khoản</b> ở mục <Link href="/tai-khoan" className="text-gold underline">Tài khoản</Link>. Xoá tài khoản là xoá luôn hồ sơ, ví Sao, mã mời, quan hệ mời, đơn nạp, chuỗi ngày ghé và quà tặng liên quan tới bạn.</li>
              </ul>
            </li>
            <li><b>Gửi yêu cầu</b> tới {lienHe}. Hãy ghi rõ quyền muốn thực hiện và email hoặc số điện thoại của tài khoản. Chúng tôi xác nhận đã nhận yêu cầu và xử lý trong thời hạn pháp luật quy định.</li>
            <li>Nếu bạn cho rằng quyền của mình bị xâm phạm, bạn có thể khiếu nại tới cơ quan chuyên trách bảo vệ dữ liệu cá nhân (Bộ Công an).</li>
          </ul>
        </>
      ),
    },
    {
      id: "tre-em", tieuDe: "Trẻ em",
      noiDung: <p>Dịch vụ dành cho người từ 16 tuổi. Người dưới 16 tuổi chỉ nên dùng khi cha mẹ hoặc người giám hộ đồng ý. Nếu
        phát hiện tài khoản của trẻ em không có sự đồng ý đó, chúng tôi sẽ xoá.</p>,
    },
    {
      id: "trinh-duyet", tieuDe: "Cookie và lưu trữ trên trình duyệt",
      noiDung: (
        <>
          <p>Chúng tôi không dùng cookie quảng cáo. Trình duyệt của bạn giữ một số mục để web chạy được, chia theo nhóm:</p>
          <Bang dau={["Nhóm", "Dùng để", "Giữ bao lâu"]} dong={[
            [<b key="a">Cần thiết</b>, "Hồ sơ trên máy, giao diện bạn chọn, lựa chọn ở hộp hỏi cookie, phiên đăng nhập (khi bạn đăng nhập)", "Đến khi bạn xoá hoặc đăng xuất"],
            [<b key="b">Tiện ích</b>, "Nhớ mã mời bạn bè; nhớ câu hỏi Kinh Dịch đã gieo để nhắc khi bạn hỏi lại cùng việc; mốc bạn bấm \"Nhắc tôi\"; ý định bạn chọn ở \"Hôm nay\" (chỉ mã ý định, để sáng hôm sau hỏi lại một chạm); ngày bạn ghé Hôm nay (để mời cài ứng dụng đúng lúc); khi bạn bật nhắc, một tệp nhỏ (service worker) để hiện thông báo — không lưu trang, không đọc dữ liệu khác", "Mã mời: đến khi dùng; câu hỏi Kinh Dịch: 30 ngày; mốc nhắc và tệp thông báo: đến khi bạn xoá hoặc tắt nhắc"],
            [<b key="c">Đo lường ẩn danh</b>, "Mã ngẫu nhiên để đếm lượt dùng, không gắn với bạn (chỉ khi bật đo lường)", "Tối đa 12 tháng"],
            [<b key="d">Thống kê truy cập (Google Analytics)</b>, "Cookie _ga để đo lượt truy cập. Bật mặc định, tắt được", "Tối đa 14 tháng"],
          ]} />
          <p>Tắt thống kê truy cập: bấm &quot;Tuỳ chọn cookie&quot; ở chân trang → &quot;Từ chối&quot;. Khi đó cookie _ga bị xoá và
            Google chỉ nhận tín hiệu ẩn danh, không cookie. Bạn đổi ý lúc nào cũng được bằng chính link đó.</p>
          <p>Tất cả các mục chỉ nằm trên máy bạn, không chứa luận giải.</p>
          <p>Xoá dữ liệu trang trong cài đặt trình duyệt là xoá hết các mục trên.</p>
        </>
      ),
    },
    {
      id: "bao-mat", tieuDe: "Bảo mật và sự cố",
      noiDung: (
        <>
          <p>Mọi kết nối đều mã hoá HTTPS. Mỗi bảng dữ liệu tài khoản có quy tắc chỉ chủ sở hữu đọc được. Khoá bí mật
            chỉ nằm ở máy chủ. Nhật ký hệ thống không ghi nội dung yêu cầu.</p>
          <p>Nếu xảy ra sự cố lộ lọt dữ liệu, chúng tôi báo cơ quan có thẩm quyền và thông báo cho người bị ảnh hưởng theo
            thời hạn pháp luật quy định, kèm các bước đã làm để khắc phục.</p>
        </>
      ),
    },
    {
      id: "thay-doi", tieuDe: "Thay đổi chính sách",
      noiDung: <p>Khi thay đổi cách xử lý dữ liệu, chúng tôi cập nhật trang này và ngày hiệu lực ở đầu trang. Thay đổi quan
        trọng sẽ được báo trên web trước khi áp dụng. Nếu thay đổi cần sự đồng ý mới, chúng tôi sẽ hỏi lại bạn.</p>,
    },
  ];

  return (
    <TrangPhapLy nhan="Pháp lý" tieuDe={nd.dau.h1 ?? "Chính sách quyền riêng tư"} duongDan={DUONG} muc={gopMucCms(muc, nd)}
      ngayHieuLuc={ngayHienThi(nd.ngayHieuLuc)}
      moDau={<LoiDanCms nd={nd}>Trang này nói rõ Hiểu Bản Thân thu dữ liệu gì, lưu ở đâu, giữ bao lâu, gửi cho ai và bạn có quyền gì.
        Mọi điều ghi ở đây khớp với cách hệ thống đang chạy.</LoiDanCms>} />
  );
}
