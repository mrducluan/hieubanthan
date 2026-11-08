// QTE-1 tuần 2 — "Tết {năm} ở {nước}": ngày Tết theo âm lịch Việt Nam (so lịch Trung Quốc), giờ giao thừa Việt Nam quy ra giờ
// từng vùng (múi giờ IANA, có giờ mùa hè) — engine tính, web chỉ hiển thị. URL không mang năm (trang tự sang Tết năm sau).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { DuongDan } from "@/components/khung/DuongDan";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { duongTetNuoc, NUOC_TET, tetNuocNgoai } from "@/lib/tet-nuoc-ngoai";
import { duongLichAm } from "@/lib/lich-am";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_TET_NUOC } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nuoc: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

async function duLieu(p: P) {
  const slug = (await p.params).nuoc;
  if (!(NUOC_TET as readonly string[]).includes(slug)) return "khong_co" as const;
  return tetNuocNgoai(slug);
}

async function metaGoc(p: P): Promise<Metadata> {
  const d = await duLieu(p);
  if (!d || d === "khong_co") return {};
  return metaTrang({ tieuDe: `Tết ${d.nam} ở ${d.ten}: ngày Tết, giờ giao thừa theo giờ địa phương`,
    moTa: `Tết Nguyên đán ${d.nam} (${d.can_chi}) ở ${d.ten}: rơi vào ${d.thu_tet} ${dmy(d.ngay_tet)}, giao thừa Việt Nam là mấy giờ ở ${d.ten}, lịch Việt và lịch Trung Quốc có lệch không.`,
    duong: duongTetNuoc(d.slug), anh: anhBai({ tieuDe: `Tết ${d.nam} ở ${d.ten}`, mang: "lich" }) });
}

export default async function Page(p: P) {
  const d = await duLieu(p);
  if (d === "khong_co") notFound();
  if (!d) throw new Error("engine lịch không phản hồi");
  const duong = duongTetNuoc(d.slug), bien = { ten: d.ten, nam: String(d.nam), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_TET_NUOC, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  const dd = [{ ten: "Trang chủ", duong: "/" }, { ten: "Tết ở nước ngoài", duong: "/tet-o-nuoc-ngoai" }, { ten: `Tết ở ${d.ten}`, duong }];
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Tết Nguyên đán", `Người Việt ở ${d.ten_day_du}`, `Năm ${d.can_chi}`] }),
        ldDuongDan(dd), ldHoiDap(d.hoi_dap),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>
      <section className="mt-8" aria-labelledby="bang-gio">
        <h2 id="bang-gio" className="text-2xl">{c("gio.tieu_de", bien)}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm" data-testid="bang-gio-giao-thua">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Nơi</th><th className="pr-3">Giờ địa phương</th><th>Ghi chú</th></tr></thead>
            <tbody>{d.gio_giao_thua_vn.map((v) => (
              <tr key={v.mui_gio} className="border-t border-line/50 align-top">
                <td className="py-2 pr-3 text-fg">{v.thanh_pho.join("; ")}</td>
                <td className="pr-3 text-fg"><b>{v.gio}</b> ngày {dmy(v.ngay)}</td>
                <td className="text-fg-muted">{v.gio_mua_he ? "đang giờ mùa hè" : "giờ chuẩn"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">Đón giao thừa tại chỗ: 0 giờ đêm {d.dem_giao_thua} theo giờ nơi bạn ở.</p>
      </section>
      <section className="mt-8 space-y-3 text-sm leading-relaxed text-fg-muted" aria-labelledby="lich-viet-trung">
        <h2 id="lich-viet-trung" className="text-2xl text-fg">Lịch Việt hay lịch Trung Quốc</h2>
        <p data-testid="ghi-chu-lich">{d.ghi_chu_lich}</p>
        <p>{d.cong_dong}</p>
        <p>{d.hoang_dao}</p>
        <p>{d.xong_dat}</p>
      </section>
      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href={`/tuoi-xong-dat/${d.nam}`} className="text-gold underline">{c("cuoi.link", bien)}</Link>
        {" "}· <Link href={duongLichAm(d.nam)} className="text-gold underline">Lịch âm {d.nam}</Link>
        {" "}· <Link href="/hom-nay" className="text-gold underline">Hôm nay của bạn (theo giờ nơi bạn ở)</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {NUOC_TET.filter((s) => s !== d.slug).map((s) => <Link key={s} href={duongTetNuoc(s)} className="text-gold underline">Tết ở {s === "my" ? "Mỹ" : s === "nhat-ban" ? "Nhật Bản" : s === "uc" ? "Úc" : "Canada"}</Link>)}
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
