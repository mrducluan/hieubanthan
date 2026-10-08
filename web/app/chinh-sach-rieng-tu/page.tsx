// PL-1 — Chính sách quyền riêng tư & bảo vệ dữ liệu cá nhân. Viết theo ĐÚNG những gì hệ thống đang làm
// (rà mã 2026-10-08: web/lib/hoso.ts, lib/do-luong.ts, engine/app/nhat_ky.py, narrative/hoi_van.py, migrations 0006–0008).
// Sửa cách xử lý dữ liệu ở đâu → sửa trang này + NGAY_HIEU_LUC trong lib/van-hanh.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { Bang, TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { DANG_CAP_NHAT, vanHanh } from "@/lib/van-hanh";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư",
  description: "Hiểu Bản Thân thu gì, lưu ở đâu, bao lâu, gửi cho ai và bạn có quyền gì với dữ liệu cá nhân của mình — theo Luật Bảo vệ dữ liệu cá nhân 2025.",
  alternates: { canonical: "/chinh-sach-rieng-tu" },
};

export default function ChinhSachRiengTu() {
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
          <li>Chúng tôi <b>không lưu nội dung luận giải gắn với tài khoản</b>, không lưu ảnh của bạn, <b>không bán dữ liệu</b>, không dùng dữ liệu để quảng cáo nhắm mục tiêu.</li>
          <li>Phần AI diễn đạt chỉ nhận câu hỏi và các kết quả đã tính, <b>không nhận họ tên hay ngày giờ sinh</b>.</li>
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
            [<b key="a">Hồ sơ trên máy</b>, "Bạn nhập họ tên, ngày giờ sinh, giới tính, nơi sinh", "Chỉ trong trình duyệt của bạn (localStorage)", "Đến khi bạn xoá hồ sơ hoặc xoá dữ liệu trình duyệt"],
            [<b key="b">Dữ liệu gửi để tính</b>, "Mỗi lần xem bài đọc, lá số, hợp đôi", "Máy chủ tính toán xử lý trong bộ nhớ", "Không lưu — bỏ ngay sau khi trả kết quả"],
            [<b key="c">Tài khoản</b>, "Bạn đăng nhập bằng email, Google hoặc số điện thoại", "Supabase (Singapore)", "Đến khi bạn xoá tài khoản"],
            [<b key="d">Hồ sơ lưu vào tài khoản</b>, "Chỉ khi bạn bấm lưu", "Supabase (Singapore), chỉ chủ tài khoản đọc được", "Đến khi bạn xoá hồ sơ hoặc tài khoản"],
            [<b key="e">Ví Sao, mã mời</b>, "Khi bạn có tài khoản, mời bạn bè, dùng Sao", "Supabase (Singapore)", "Đến khi bạn xoá tài khoản"],
            [<b key="f">Câu hỏi đã lọc</b>, "Khi bạn hỏi đáp (nếu bật nhật ký cải thiện chất lượng)", "Supabase (Singapore)", "Tối đa 24 tháng"],
            [<b key="g">Số liệu sử dụng ẩn danh</b>, "Khi bạn dùng web (nếu bật đo lường)", "PostHog", "Tối đa 12 tháng"],
            [<b key="g2">Số liệu truy cập (Google Analytics)</b>, "Chỉ khi bạn bấm \"Đồng ý\" ở hộp hỏi cookie", "Google (qua Google Tag Manager)", "Tối đa 14 tháng"],
            [<b key="h">Báo lỗi kỹ thuật</b>, "Khi trang hoặc máy chủ gặp lỗi (nếu bật)", "Sentry", "Tối đa 90 ngày"],
          ]} />
          <p><b>Địa chỉ IP</b> chỉ được băm (không đảo ngược được) và giữ trong bộ nhớ máy chủ tối đa 24 giờ để giới hạn số lượt
            dùng AI mỗi người, không ghi vào đâu.</p>
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
          <li><b>Cải thiện chất lượng</b> (câu hỏi đã lọc, số liệu ẩn danh, báo lỗi): chỉ dùng dữ liệu không nhận diện được bạn.</li>
          <li>Chúng tôi <b>không</b> dùng dữ liệu cho quảng cáo nhắm mục tiêu, <b>không</b> mua bán dữ liệu, <b>không</b> ra quyết định tự động gây ảnh hưởng pháp lý tới bạn.</li>
        </ul>
      ),
    },
    {
      id: "ben-thu-ba", tieuDe: "Bên xử lý thay chúng tôi và chuyển dữ liệu ra nước ngoài",
      noiDung: (
        <>
          <Bang dau={["Dịch vụ", "Việc làm", "Dữ liệu nhận", "Vị trí"]} dong={[
            ["Vercel", "Chạy trang web", "Yêu cầu bạn gửi để tính (không lưu)", "Hàm chạy tại Singapore"],
            ["Render", "Chạy máy tính toán", "Ngày giờ sinh để tính (không lưu)", "Singapore"],
            ["Supabase", "Tài khoản, hồ sơ đã lưu, ví Sao, câu hỏi đã lọc", "Như mục 3", "Singapore"],
            ["OpenRouter", "AI diễn đạt câu trả lời (khi bật)", "Câu hỏi bạn gõ + kết quả đã tính; không có họ tên, ngày giờ sinh", "Hoa Kỳ"],
            ["PostHog", "Đo lường ẩn danh (khi bật)", "Sự kiện sử dụng, mã ẩn danh", "Hoa Kỳ hoặc EU"],
            ["Google (Tag Manager, Analytics)", "Đo lượt truy cập — chỉ khi bạn đồng ý", "Trang đã xem, loại thiết bị, mã cookie _ga; không họ tên, ngày giờ sinh", "Hoa Kỳ"],
            ["Sentry", "Báo lỗi (khi bật)", "Thông tin lỗi kỹ thuật", "Hoa Kỳ hoặc EU"],
          ]} />
          <p>Một số dữ liệu trên được xử lý ngoài Việt Nam. Chúng tôi chỉ dùng nhà cung cấp có cam kết bảo mật bằng
            văn bản, và gửi đi ít dữ liệu nhất có thể. Câu hỏi gõ vào ô hỏi đáp được gửi nguyên văn cho AI diễn đạt,
            vì vậy <b>đừng gõ số điện thoại, địa chỉ hay thông tin định danh</b> vào câu hỏi.</p>
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
                <li>xoá hồ sơ đã lưu, hoặc <b>xoá hẳn tài khoản</b> ở mục <Link href="/tai-khoan" className="text-gold underline">Tài khoản</Link>. Xoá tài khoản là xoá luôn hồ sơ, ví Sao và mã mời.</li>
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
      id: "trinh-duyet", tieuDe: "Lưu trữ trên trình duyệt (cookie, localStorage)",
      noiDung: (
        <>
          <p>Chúng tôi không dùng cookie quảng cáo. Trình duyệt của bạn giữ một số mục để web chạy được:</p>
          <ul>
            <li><code>hbt.hoso.v1</code>: hồ sơ trên máy. <code>hbt.laso.giaodien</code>: giao diện lá số bạn chọn.</li>
            <li><code>hbt.gt</code>, <code>hbt.ma_moi</code>: mã mời bạn bè.</li>
            <li><code>kd-da-hoi</code>: câu hỏi Kinh Dịch bạn đã gieo, giữ 30 ngày để nhắc khi bạn hỏi lại cùng việc. Mục này chỉ nằm trên máy bạn.</li>
            <li>Cookie phiên đăng nhập (chỉ khi bạn đăng nhập). Mã ẩn danh của PostHog (chỉ khi bật đo lường).</li>
            <li><code>hbt.dong-y-cookie.v1</code>: lựa chọn của bạn ở hộp hỏi cookie.</li>
            <li>Cookie <code>_ga</code>, <code>_ga_*</code> của Google Analytics: <b>chỉ đặt khi bạn bấm &quot;Đồng ý&quot;</b>. Chưa
              đồng ý thì không tải mã Google nào. Đổi ý bằng link &quot;Tuỳ chọn cookie&quot; ở chân trang; khi từ chối,
              cookie _ga bị xoá.</li>
          </ul>
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
    <TrangPhapLy nhan="Pháp lý" tieuDe="Chính sách quyền riêng tư" duongDan="/chinh-sach-rieng-tu" muc={muc}
      moDau={<p>Trang này nói rõ Hiểu Bản Thân thu dữ liệu gì, lưu ở đâu, giữ bao lâu, gửi cho ai và bạn có quyền gì.
        Mọi điều ghi ở đây khớp với cách hệ thống đang chạy.</p>} />
  );
}
