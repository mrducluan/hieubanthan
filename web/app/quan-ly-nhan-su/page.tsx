// Trang "Quản lý nhân sự theo ngũ hành" (/quan-ly-nhan-su — QLNS-1, chủ dự án 2026-11-25; URL cũ /ban-do-doi-ngu, /doanh-chu
// 308 một bước qua lib/chuyen-huong.json). Công cụ cho chủ doanh nghiệp / trưởng nhóm: 5 hành của cả đội, cách phối hợp với
// từng người, tình huống dễ gặp, kế hoạch 30 ngày. Kho tình huống + vai trò 5 hành ở phần nội dung đọc từ engine (một nguồn,
// `GET /v1/doanh-chu/tinh-huong`) — web không viết cứng tri thức. Chỉ để phối hợp và trao đổi — không tuyển chọn, đánh giá,
// xếp lương, kỷ luật (Bộ luật Lao động cấm phân biệt đối xử). Không nêu tên bài trắc nghiệm của tổ chức khác (Luật Quảng cáo).
import type { Metadata } from "next";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhungDieuHanh } from "@/components/doanh-chu/KhungDieuHanh";
import { CtaCuoiQuanLy } from "@/components/doanh-chu/CtaCuoiQuanLy";
import { AnhQuanLy } from "@/components/seo/AnhQuanLy";
import { JsonLd } from "@/components/seo/JsonLd";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { layDanhMucQuanLy } from "@/lib/quan-ly-danh-muc";
import { hinhQL, urlHinhQL } from "@/lib/quan-ly-hinh";
import { goiLd, ldAnh, ldDuongDan, ldHoiDap, ldTrangWeb, siteUrl, urlDayDu } from "@/lib/seo";

const DUONG = "/quan-ly-nhan-su";
const CAP_NHAT = "2026-11-25";

const HOI_DAP = [
  {
    hoi: "Quản lý nhân sự theo ngũ hành là gì?",
    dap: "Là nhìn đội ngũ qua năm trục làm việc lấy từ ngày sinh của từng người: kiểm soát (Kim), mở rộng (Mộc), đối ngoại – phân tích (Thuỷ), tuyến đầu (Hoả), vận hành (Thổ). Từ đó thấy nhóm đang dồn về trục nào, thiếu trục nào, và nên phối hợp với từng người ra sao. Đây là cách nhìn tham khảo để chia việc và trao đổi, không thay cho đánh giá công việc thực tế.",
  },
  {
    hoi: "Kết quả cho người quản lý gồm những gì?",
    dap: "Biểu đồ 5 hành của cả nhóm, thẻ từng người (sở trường, điều bạn nên chú ý khi trao đổi, hai câu hỏi cho buổi nói chuyện riêng, câu mở lời khi bất đồng), các tình huống dễ gặp với chính nhóm này và kế hoạch 30 ngày chia theo tuần, mỗi việc nêu vì sao.",
  },
  {
    hoi: "Khác gì một bài trắc nghiệm tính cách dài?",
    dap: "Trắc nghiệm hỏi từng người hàng chục câu về thói quen; công cụ này chỉ cần ngày sinh và đọc theo phép tính cố định của ngũ hành, thần số học. Hai cách bổ trợ nhau: trắc nghiệm cho biết người ấy tự thấy mình thế nào, bản đồ ngũ hành cho một khung chung để cả nhóm nói chuyện. Kết quả là gợi ý để hỏi thêm, không phải kết luận về ai.",
  },
  {
    hoi: "Có dùng để tuyển người, đánh giá hay xếp lương không?",
    dap: "Không. Công cụ chỉ gợi ý cách phối hợp và trao đổi trong nhóm đã có. Không dùng để chọn hay loại ứng viên, chấm điểm, xếp lương hay kỷ luật ai — pháp luật lao động cấm phân biệt đối xử, và ngày sinh không nói lên năng lực.",
  },
  {
    hoi: "Xem tuổi hợp tác làm ăn ở đây xét những gì?",
    dap: "Với từng cặp bạn và cộng sự, hệ thống xét con giáp hai người (tam hợp, lục hợp, xung), hành nổi trội trong Bát tự (người này có bù hành bạn đang thiếu không) và nhịp năm cá nhân năm nay. Kết quả là cách phối hợp, không phải lời phán nên hay không nên làm việc với ai.",
  },
  {
    hoi: "Ngày sinh của mọi người có bị lưu không?",
    dap: "Không. Ngày sinh chỉ đi qua một lượt tính rồi bỏ. Cách tốt nhất là gửi link để từng người tự điền trên máy của họ: họ gửi lại một mã bảo mật, bạn không thấy ngày sinh, còn họ nhận được bản \"Cách làm việc của bạn\" của riêng mình.",
  },
  {
    hoi: "Có mất phí không, cần tài khoản không?",
    dap: "Xem đội ngũ mẫu 4 vai trò luôn miễn phí, không cần tài khoản. Chạy cho đội thật hiện đang mở dùng thử; khi bắt đầu tính bằng Sao, số Sao hiện rõ trước khi bạn bấm xem.",
  },
];

// So sánh với trắc nghiệm tính cách nói CHUNG (không nêu tên sản phẩm của tổ chức khác — Luật Quảng cáo).
const SO_SANH = [
  ["Chuẩn bị", "Chỉ cần ngày sinh, có kết quả ngay", "Mỗi người trả lời vài chục câu"],
  ["Nhìn cả nhóm", "Biểu đồ 5 trục của cả đội, thấy ngay trục thiếu", "Thường đọc từng hồ sơ rời rồi tự ghép"],
  ["Theo thời gian", "Có nhịp năm của từng người để chọn việc hợp lúc", "Mô tả nét tính cách khá cố định"],
  ["Gợi ý hành động", "Kế hoạch 30 ngày, câu hỏi nói chuyện riêng, câu mở lời", "Tuỳ người đọc tự suy ra"],
  ["Nên dùng khi", "Cần một khung chung để cả nhóm trao đổi", "Muốn biết mỗi người tự thấy mình thế nào"],
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [nd, dm] = await Promise.all([layNoiDungTrang(DUONG), layDanhMucQuanLy()]);
  const h1 = nd.dau.h1 ?? CHU_DOANH_CHU.dau_trang.lon;
  const dd = [{ ten: "Trang chủ", duong: "/" }, { ten: "Quản lý nhân sự", duong: DUONG }];
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          ...ldTrangWeb({
            duong: DUONG,
            ten: h1,
            tomTat: CHU_DOANH_CHU.meta.mo_ta,
            about: ["Quản lý nhân sự", "Ngũ hành", "Bát tự", "Thần số học", "Phối hợp đội nhóm"],
          }),
          dateModified: CAP_NHAT,
          primaryImageOfPage: ldAnh(urlHinhQL("quy-trinh"), hinhQL("quy-trinh", null)?.chuThich ?? h1),
          mainEntity: { "@id": `${urlDayDu(DUONG)}#ung-dung` },
        },
        {
          "@type": "WebApplication",
          "@id": `${urlDayDu(DUONG)}#ung-dung`,
          name: "Bản đồ quản lý nhân sự",
          url: urlDayDu(DUONG),
          description: CHU_DOANH_CHU.meta.mo_ta,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "vi-VN",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
          publisher: { "@id": `${siteUrl()}/#to-chuc` },
          isPartOf: { "@id": `${siteUrl()}/#website` },
        },
        ldDuongDan(dd),
        ldHoiDap(HOI_DAP),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho={CHU_DOANH_CHU.dau_trang.nho} lon={h1} mo_ta={nd.dau.loiDan ?? CHU_DOANH_CHU.dau_trang.mo_ta} />
      <div className="mt-4">
        <TraLoiNhanh chu="Bản đồ quản lý nhân sự đặt 5 hành và nhịp năm của người quản lý cạnh 1–8 người trong nhóm: nhóm mạnh trục nào, thiếu trục nào, nên phối hợp với từng người ra sao, tình huống nào dễ xảy ra và 4 tuần tới nên làm gì trước. Không lưu ngày sinh; chỉ để phối hợp và trao đổi, không dùng tuyển chọn hay đánh giá ai." />
      </div>
      <div className="mt-6">
        <KhungDieuHanh />
      </div>

      <section aria-labelledby="cam-nang-quan-ly" className="mx-auto mt-14 max-w-3xl border-t border-line/50 pt-8 text-fg-muted">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cam-nang-quan-ly" className="text-2xl text-fg">Cách dùng bản đồ quản lý nhân sự trong ba bước</h2>
          <p className="text-xs text-fg-faint">Cập nhật <time dateTime={CAP_NHAT}>25/11/2026</time></p>
        </div>
        <p className="mt-3 leading-relaxed">
          Công cụ nhận ngày sinh của 1–8 người và trả lại ba thứ: biểu đồ 5 hành của cả nhóm, thẻ phối hợp cho từng người và
          kế hoạch 30 ngày. Bạn có thể tự nhập, hoặc gửi link để mỗi người tự điền trên máy của họ — họ nhận bản &quot;Cách làm
          việc của bạn&quot;, còn bạn không thấy ngày sinh của họ.
        </p>
        <AnhQuanLy kieu="van-phong" dm={dm} />
        <AnhQuanLy kieu="quy-trinh" dm={dm} />

        <h2 className="mt-10 text-2xl text-fg">Năm trục làm việc trong một đội ngũ</h2>
        <p className="mt-3 leading-relaxed">
          Va chạm trong nhóm thường không do ai kém cố gắng, mà do người thiên mở rộng và người thiên kiểm soát làm việc theo
          hai nhịp khác nhau. Bảng dưới là cách công cụ gợi ý vai trò theo hành nổi trội — để chia việc và trao đổi, không để
          xếp hạng người:
        </p>
        <AnhQuanLy kieu="ngu-hanh" dm={dm} />
        {dm && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-line/70">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line/70 bg-surface/40 text-fg">
                  <th className="px-3 py-2.5 font-medium">Hành</th>
                  <th className="px-3 py-2.5 font-medium">Vai trò thường hợp</th>
                  <th className="px-3 py-2.5 font-medium">Khi được giao đúng việc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {dm.vai_tro_hanh.map((r) => (
                  <tr key={r.hanh}>
                    <td className="px-3 py-2.5 font-medium text-fg">{r.hanh}</td>
                    <td className="px-3 py-2.5">{r.vai_tro}</td>
                    <td className="px-3 py-2.5">{r.gia_tri}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dm && dm.ke_hoach_mau.length > 0 && (
          <>
            <h2 className="mt-10 text-2xl text-fg">Kế hoạch 30 ngày cho người quản lý</h2>
            <p className="mt-2 leading-relaxed">
              Kế hoạch chia thành bốn tuần. Dưới đây là khung chung; khi chạy cho nhóm thật, mỗi việc gắn với đúng người trong
              nhóm kèm lý do vì sao chọn việc đó.
            </p>
            <AnhQuanLy kieu="ke-hoach" dm={dm} />
            <ol className="mt-3 space-y-2 leading-relaxed" data-testid="ke-hoach-mau">
              {dm.ke_hoach_mau.map((t) => (
                <li key={t.tuan}><strong className="text-fg">{t.tuan} — {t.tieu_de}.</strong> {t.y}</li>
              ))}
            </ol>
          </>
        )}

        {dm && (
          <>
            <h2 className="mt-10 text-2xl text-fg">Tình huống quản lý nhân sự hay gặp và câu mở lời mẫu</h2>
            <p className="mt-2 leading-relaxed">
              Khi chạy bản đồ cho nhóm của bạn, công cụ chỉ chọn những tình huống khớp với dữ liệu nhóm đó. Dưới đây là toàn bộ kho:
            </p>
            <AnhQuanLy kieu="tinh-huong" dm={dm} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {dm.tinh_huong.map((t) => (
                <article key={t.ma} className="rounded-xl border border-line/60 bg-surface/30 p-4">
                  <h3 className="text-base font-medium text-fg">{t.van_de}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{t.goc_nhin}</p>
                  <p className="mt-2 text-sm leading-relaxed"><strong className="text-fg">Nên làm:</strong> {t.viec}</p>
                  <p className="mt-2 text-sm leading-relaxed"><strong className="text-gold">Câu mở lời:</strong> {t.mo_loi}</p>
                </article>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-10 text-2xl text-fg">So với một bài trắc nghiệm tính cách dài</h2>
        <p className="mt-2 leading-relaxed">Hai cách nhìn bổ trợ nhau, không cách nào thay cách nào:</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 bg-surface/40 text-fg">
                <th className="px-3 py-2.5 font-medium">Tiêu chí</th>
                <th className="px-3 py-2.5 font-medium">Bản đồ ngũ hành</th>
                <th className="px-3 py-2.5 font-medium">Trắc nghiệm tính cách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {SO_SANH.map((r) => (
                <tr key={r[0]}>
                  <td className="px-3 py-2.5 font-medium text-fg">{r[0]}</td>
                  <td className="px-3 py-2.5 text-fg">{r[1]}</td>
                  <td className="px-3 py-2.5">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-2xl text-fg">Câu hỏi thường gặp về quản lý nhân sự theo ngũ hành</h2>
        <dl className="mt-3 space-y-4">
          {HOI_DAP.map((h) => (
            <div key={h.hoi}>
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1 leading-relaxed">{h.dap}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CtaCuoiQuanLy duong={DUONG} />
    </div>
  );
}
