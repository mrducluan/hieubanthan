// Kỳ Môn Độn Giáp — bàn theo giờ: giờ này hướng nào thuận, hợp việc gì; mười ba khung giờ của hôm nay; giải nghĩa tám cửa và
// các thế bàn. Engine lập bàn + đọc bàn (KM-1, KM-2); trang chỉ hiển thị. Câu trả lời nhanh, bảng tám hướng và phần giải nghĩa
// dựng ở máy chủ (Google, bot AI đọc được không cần JS). Engine lỗi → 5xx.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { HoiDapHien, TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { BanKyMon } from "@/components/ky-mon/BanKyMon";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { duongDanCongCu } from "@/lib/duong-dan";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { DUONG_KY_MON, layKyMonHomNay, type MucDanhMucKM } from "@/lib/ky-mon";

const MAC = {
  tieuDe: "Kỳ Môn Độn Giáp: giờ này nên đi hướng nào?",
  moTa: "Lập bàn Kỳ Môn Độn Giáp theo giờ, miễn phí: tám hướng của giờ này hướng nào thuận, hợp gặp gỡ, ký kết, đi xa hay nộp hồ sơ; giờ tốt trong ngày cho việc bạn định làm. Có giải nghĩa và câu sách xưa.",
};

const HOI_DAP = [
  { hoi: "Kỳ Môn Độn Giáp là gì?", dap: "Là một phép chọn giờ và chọn hướng của người xưa. Mỗi canh giờ (hai tiếng) có một «bàn» chín ô: mỗi hướng có một cửa, một sao, một thần. Người xưa nhìn cửa trước để biết hướng ấy hợp việc gì." },
  { hoi: "Bàn này có riêng cho tôi không?", dap: "Không. Bàn Kỳ Môn theo giờ là của thời điểm: ai xem cùng giờ, cùng múi giờ đều ra một bàn. Vì vậy trang không hỏi tên hay ngày sinh. Muốn xem riêng theo ngày giờ sinh thì dùng lá số Tử vi hoặc Bát tự." },
  { hoi: "«Đi về hướng thuận» nghĩa là sao?", dap: "Hướng tính từ chỗ bạn đang đứng (nhà hoặc chỗ làm). Bạn có thể hẹn ở nơi nằm về phía ấy, xuất phát theo phía ấy, hoặc đơn giản là ngồi quay mặt về phía ấy khi làm việc." },
  { hoi: "Khác gì với xem ngày tốt?", dap: "Xem ngày tốt chọn NGÀY cho việc lớn. Kỳ Môn theo giờ đi tiếp một bước: trong ngày đã chọn, giờ nào và hướng nào hợp việc ấy. Hai cách dùng được cùng nhau." },
  { hoi: "Vì sao có giờ ghi «nên giữ nhịp»?", dap: "Có những giờ cả bàn đứng yên hoặc lật ngược, hoặc giờ ngược với ngày. Sách dặn những giờ ấy dù có hướng tốt cũng chưa nên làm việc lớn; việc thường ngày thì vẫn làm bình thường." },
  { hoi: "Đây có phải là dự báo không?", dap: "Không. Đây là một cách sắp xếp giờ và hướng theo sách xưa, để bạn chọn lúc làm việc cho có chủ đích. Trang không nói việc sẽ thành hay hỏng; quyết định vẫn là của bạn." },
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG_KY_MON }), await layNoiDungTrang(DUONG_KY_MON));
}

function MucGiaiNghia({ m, nhan }: { m: MucDanhMucKM; nhan?: string }) {
  return (
    <li className="rounded-xl border border-line/70 p-3">
      <h3 className="text-base text-fg">{nhan ?? m.ten}{m.han && <span lang="zh-Hant" className="ml-2 font-serif text-sm text-fg-faint">{m.han}</span>}
        {m.tom && <span className="ml-2 text-xs text-fg-muted">{m.tom}</span>}</h3>
      {m.dieu_kien && <p className="mt-1 text-xs text-fg-faint">Khi nào có: {m.dieu_kien}</p>}
      <p className="mt-1.5 text-sm leading-relaxed">{m.loi}</p>
      {m.nen && <p className="mt-1 text-sm text-fg-muted">Nên: {m.nen}</p>}
      {m.tranh && <p className="mt-1 text-sm text-fg-muted">Tránh: {m.tranh}</p>}
      {m.sach && <p className="mt-1.5 text-xs leading-relaxed text-fg-faint">{m.sach}</p>}
    </li>
  );
}

export default async function Page() {
  const [[ban, ngay, dm], nd] = await Promise.all([layKyMonHomNay(), layNoiDungTrang(DUONG_KY_MON)]);
  const h1 = nd.dau.h1 ?? MAC.tieuDe;
  const dd = duongDanCongCu(DUONG_KY_MON, "Kỳ Môn Độn Giáp");
  const d = ban.doc;
  const [y, m, ng] = ban.thoi_diem.slice(0, 10).split("-");
  const tl = `Lúc ${ban.thoi_diem.slice(11)} ngày ${Number(ng)}/${Number(m)}/${y} (giờ Việt Nam) là giờ ${d.gio.chi}, ${d.gio.khung}. ${d.tom_tat} ${d.luu_y_gio[0] ?? ""}
    Kỳ Môn Độn Giáp là phép chọn giờ và hướng của người xưa: mỗi canh giờ có một bàn tám hướng, mỗi hướng một cửa.
    Ba cửa Khai, Hưu, Sinh được coi là thuận. Bàn đổi sau mỗi hai tiếng.`.replace(/\s+/g, " ").trim();
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG_KY_MON, ten: h1, tomTat: MAC.moTa, about: ["Kỳ Môn Độn Giáp", "Chọn giờ tốt", "Chọn hướng"] }),
        ldDuongDan(dd), ldHoiDap(HOI_DAP),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho="Huyền học · chọn giờ và hướng" lon={h1}
        mo_ta={nd.dau.loiDan ?? "Mỗi hai tiếng, tám hướng quanh bạn đổi vai một lần. Xem giờ này hướng nào thuận, hợp việc gì, và hôm nay giờ nào hợp việc bạn định làm."} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG_KY_MON} viTri="tren" className="mb-6" />
      <div className="mb-8"><TraLoiNhanh chu={tl} /></div>

      <BanKyMon banDau={ban} ngayDau={ngay} viec={dm.viec} />

      <section aria-labelledby="km-bang" className="mt-10">
        <h2 id="km-bang" className="text-2xl">Tám hướng của giờ {d.gio.chi} hôm nay</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm" data-testid="km-bang-huong">
            <thead className="text-fg-muted"><tr><th className="py-2 pr-3 font-normal">Hướng</th><th className="py-2 pr-3 font-normal">Cửa</th><th className="py-2 pr-3 font-normal">Mức</th><th className="py-2 pr-3 font-normal">Sao</th><th className="py-2 font-normal">Thần</th></tr></thead>
            <tbody>{d.huong.map((h) => (
              <tr key={h.cung} className="border-t border-line/60"><th scope="row" className="py-2 pr-3 font-normal text-fg">{h.phuong}</th>
                <td className="py-2 pr-3">{h.cua.ten} <span className="text-fg-faint">({h.cua.tom.toLowerCase()})</span></td>
                <td className="py-2 pr-3">{h.muc_nhan}</td><td className="py-2 pr-3">{h.sao.ten}</td><td className="py-2">{h.than.ten}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-fg-muted">{dm.cach_dung}</p>
        <p className="mt-1 text-sm text-fg-faint">{dm.ranh_gioi}</p>
      </section>

      <section aria-labelledby="km-tam-cua" className="mt-12">
        <h2 id="km-tam-cua" className="text-2xl">Tám cửa trong Kỳ Môn Độn Giáp nghĩa là gì?</h2>
        <p className="mt-2 text-sm text-fg-muted">Theo {dm.meta.nguon}. Câu chữ Hán là nguyên văn; lời tiếng Việt do ban biên tập viết lại cho đời sống ngày nay.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2" data-testid="km-tam-cua-ds">{dm.cua.map((c) => <MucGiaiNghia key={c.ma} m={c} nhan={`Cửa ${c.ten}`} />)}</ul>
      </section>

      <section aria-labelledby="km-the" className="mt-12">
        <h2 id="km-the" className="text-2xl">Các thế bàn Kỳ Môn hay gặp</h2>
        <p className="mt-2 text-sm text-fg-muted">Mỗi thế có điều kiện rõ trong sách; trang chỉ báo khi bàn của giờ có đúng điều kiện ấy.</p>
        <details className="mt-4 rounded-2xl border border-line/70 p-4" open>
          <summary className="cursor-pointer text-fg">Thế thuận ({dm.cach.filter((c) => c.loai === "cat").length})</summary>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">{dm.cach.filter((c) => c.loai === "cat").map((c) => <MucGiaiNghia key={c.ma} m={c} />)}</ul>
        </details>
        <details className="mt-3 rounded-2xl border border-line/70 p-4">
          <summary className="cursor-pointer text-fg">Thế nên chậm lại ({dm.cach.filter((c) => c.loai === "hung").length})</summary>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">{dm.cach.filter((c) => c.loai === "hung").map((c) => <MucGiaiNghia key={c.ma} m={c} />)}</ul>
        </details>
        <details className="mt-3 rounded-2xl border border-line/70 p-4">
          <summary className="cursor-pointer text-fg">Chín sao và tám thần</summary>
          {dm.sao_chung && <p className="mt-3 text-xs text-fg-faint">{dm.sao_chung}</p>}
          <ul className="mt-3 grid gap-3 md:grid-cols-2">{[...dm.sao, ...dm.than].map((c) => <MucGiaiNghia key={c.ma + c.ten} m={c} />)}</ul>
        </details>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG_KY_MON} viTri="duoi" className="mt-10" />
      <div className="mt-12"><HoiDapHien ds={HOI_DAP} /></div>

      <p className="mt-10 text-sm text-fg-muted">
        Đọc thêm: <Link href="/xem-ngay-tot" className="text-gold underline">Xem ngày tốt</Link> ·{" "}
        <Link href="/hom-nay" className="text-gold underline">Hôm nay của bạn</Link> ·{" "}
        <Link href="/phong-thuy" className="text-gold underline">Hướng nhà hợp tuổi</Link> ·{" "}
        <Link href="/kinh-dich" className="text-gold underline">Gieo quẻ Kinh Dịch</Link>
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG_KY_MON} viTri="cuoi" className="mt-10" />
    </div>
  );
}
