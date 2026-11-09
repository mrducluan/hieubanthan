// Ý3 (2026-11-09) — mục lục "Sinh ở nước ngoài": người Việt xa quê lập lá số thế nào (giờ địa phương, múi giờ + giờ mùa hè tự
// tra theo thành phố), mỗi nước một trang dữ kiện engine tính. Khâu THU HÚT (QTE-1 giai đoạn 0: trang SEO Mỹ/Nhật/Úc/Canada).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { DuongDan } from "@/components/khung/DuongDan";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { mucSoTrang } from "@/lib/so-trang";
import { DUONG_SINH_NN, duongSinhNN, mucLucSinhNN } from "@/lib/sinh-nuoc-ngoai";

const MD = mucSoTrang(DUONG_SINH_NN)!.mac_dinh;
const DUONG_DAN = [{ ten: "Trang chủ", duong: "/" }, { ten: "Huyền học", duong: "/huyen-hoc" }, { ten: "Sinh ở nước ngoài", duong: DUONG_SINH_NN }];
const HOI_DAP = [
  { hoi: "Sinh ở nước ngoài thì nhập giờ Việt Nam hay giờ nơi sinh?", dap: "Giờ nơi sinh, đúng như giấy khai sinh. Lá số lập theo bầu trời nơi bạn sinh ra; hệ thống tự tra múi giờ và giờ mùa hè của thành phố tại ngày sinh." },
  { hoi: "Tôi không nhớ lúc đó có giờ mùa hè không?", dap: "Không cần nhớ. Chọn đúng thành phố, hệ thống tra lịch sử đổi giờ của nơi đó tại đúng ngày sinh — kể cả những năm quy tắc khác bây giờ (Nga, Đức, Hàn Quốc, Đài Loan từng đổi quy tắc)." },
  { hoi: "Ngày âm trong sổ gia đình là lịch Việt hay lịch Trung Quốc?", dap: "Hai lịch tính theo giờ Hà Nội và giờ Bắc Kinh nên có năm lệch nhau vài ngày, có năm lệch Tết. Mỗi trang nước liệt kê những ngày lệch của năm; nếu chỉ nhớ ngày âm, chọn đúng lịch ở form để engine đổi ra ngày dương." },
  { hoi: "Khi nào nên xem thêm lá số theo giờ mặt trời thực?", dap: "Khi thành phố nơi sinh nằm xa kinh tuyến của múi giờ (Pháp, Tây Ban Nha dùng giờ Trung Âu; nhiều bang Mỹ ở rìa múi) và giờ sinh sát ranh giới canh giờ. Lá số vẫn lập theo giờ đồng hồ như sách Việt; công tắc nằm ở khung Trường phái." },
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: MD.tieu_de_seo!, moTa: MD.mo_ta_seo!, duong: DUONG_SINH_NN, md: `${DUONG_SINH_NN}.md` }), await layNoiDungTrang(DUONG_SINH_NN));
}

export default async function Page() {
  const [ds, nd] = await Promise.all([mucLucSinhNN(), layNoiDungTrang(DUONG_SINH_NN)]);
  const h1 = nd.dau.h1 ?? MD.h1!;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG_SINH_NN, ten: h1, tomTat: MD.mo_ta_seo, about: ["Người Việt ở nước ngoài", "Múi giờ nơi sinh", "Lá số Tử vi", "Bát tự"] }),
        ldDuongDan(DUONG_DAN), ldHoiDap(HOI_DAP),
      )} />
      <DuongDan ds={DUONG_DAN} className="mb-2" />
      <TieuDeMuc cap={1} nho="Người Việt xa quê" lon={h1} mo_ta={nd.dau.loiDan ?? MD.loi_dan} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG_SINH_NN} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">Nhập đúng giờ trên giấy khai sinh (giờ đồng hồ nơi sinh), chọn “Sinh ở nước ngoài” rồi nước và thành phố. Múi giờ chuẩn, giờ mùa hè tại ngày sinh và lệch giờ mặt trời do hệ thống tự tra — bạn không phải đổi về giờ Việt Nam.</p>
      </section>

      <section className="mt-8" aria-labelledby="ds-nuoc">
        <h2 id="ds-nuoc" className="text-2xl">Chọn nước nơi bạn sinh</h2>
        <p className="mt-1 text-sm text-fg-muted">Mỗi trang là một bảng số riêng: múi giờ từng thành phố, mốc đổi giờ mùa hè năm nay, lịch sử giờ mùa hè theo năm sinh, ngày lịch âm Việt – Trung lệch nhau.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="ds-nuoc">
          {ds.map((n) => (
            <li key={n.ma}>
              <Link href={duongSinhNN(n.ma)} className="block rounded-xl border border-line/70 p-4 hover:border-gold/50" data-testid={`nuoc-${n.ma}`}>
                <span className="font-serif text-xl text-fg">{n.ten}</span>
                <span className="mt-1 block text-xs text-fg-muted">{n.mui_gio.join(" · ")} · {n.gio_mua_he ? "có giờ mùa hè" : "không giờ mùa hè"}{n.nam_ban_cau ? " · Nam bán cầu" : ""}</span>
                {(n.cong_tac.gio_mat_troi || n.cong_tac.mua_noi_sinh) && (
                  <span className="mt-1 block text-xs text-gold">
                    Có thêm cách xem: {[n.cong_tac.gio_mat_troi ? "giờ mặt trời thực" : null, n.cong_tac.mua_noi_sinh ? "mùa nơi sinh" : null].filter(Boolean).join(", ")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="cach-lam">
        <h2 id="cach-lam" className="text-2xl">Ba điều cần biết trước khi nhập</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-fg-muted">
          <li><b className="text-fg">Giờ địa phương, không đổi.</b> Lá số Tử vi, Bát tự lập theo nơi sinh; giờ Việt Nam lúc đó không liên quan.</li>
          <li><b className="text-fg">Giờ mùa hè tự trừ.</b> Nếu lúc sinh đồng hồ đang chạy giờ mùa hè, hệ thống tự trừ một giờ — bạn vẫn nhập đúng con số trên giấy tờ.</li>
          <li><b className="text-fg">Bát tự nhạy với múi giờ.</b> Tháng và năm đổi đúng lúc giao tiết nên người sinh sát đầu tháng dương lịch cần chọn đúng thành phố, không chỉ chọn nước.</li>
        </ol>
      </section>

      <section className="mt-8" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-3 space-y-3">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG_SINH_NN} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">Nhập hồ sơ một lần dùng cho mọi lá số: <Link href="/bat-tu" className="text-gold underline">Bát tự</Link> · <Link href="/tu-vi" className="text-gold underline">Tử vi</Link>. Ở nước ngoài và muốn xem Hôm nay theo giờ nơi ở: <Link href="/hom-nay" className="text-gold underline">Hôm nay của bạn</Link>.</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG_SINH_NN} viTri="cuoi" className="mt-6" />
    </div>
  );
}
