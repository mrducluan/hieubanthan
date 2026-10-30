// NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}": năm con gì, mệnh gì, Tết, Tam tai, 12 con giáp,
// mốc lễ, hạn năm + lối sang mọi trang tra theo tuổi của năm đó và "Năm {năm} của riêng bạn" (/thoi-gian-toi).
// Engine dựng toàn bộ dữ kiện (`/v1/nam/{nam}`); web chỉ hiển thị. Index năm âm hiện tại + năm sau.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, duongHanNam, duongLamNhaNam, duongSaoHanNam, duongXongDatNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { dmy, duongCuoiHoi, duongNam, duongSinhCon, namCongKhai, namIndex } from "@/lib/nam";
import { duongLichAm } from "@/lib/lich-am";
import { duongThang } from "@/lib/hoang-lich";
import { duongTrang } from "@/lib/kien-thuc";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const MENH_TOI = 2027;   // cụm "Sinh năm X mệnh gì" có tới năm này (engine kb/trang_menh.NAM_CUOI)

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Năm ${n} là năm con gì, mệnh gì? Tết, Tam tai, tuổi xung`,
    moTa: `Năm ${n} theo âm lịch Việt Nam: can chi, mệnh nạp âm, ngày Tết, tháng nhuận, tuổi Tam tai, năm tuổi, tuổi xung, mốc lễ trong năm và lối tra sao hạn, tuổi làm nhà, xông đất, cưới hỏi.`,
    duong: duongNam(n), anh: anhBai({ tieuDe: `Năm ${n}`, mang: "lich" }) });
  return namIndex(n, await namAmHienTai()) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await namCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongNam(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_NAM, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  const [tetY, tetM] = [Number(d.tet.slice(0, 4)), Number(d.tet.slice(5, 7))];
  const o: [string, string][] = [
    ["Can chi", d.can_chi], ["Mệnh nạp âm", `${d.nap_am.ten} · hành ${d.nap_am.hanh}`],
    ["Tết Nguyên đán", dmy(d.tet)], ["Năm âm lịch kết thúc", dmy(d.het_nam)],
    ["Lập xuân", dmy(d.lap_xuan)], ["Tháng nhuận", d.thang_nhuan ? `Tháng ${d.thang_nhuan}` : "Không có"],
    ["Năm tuổi", `Tuổi ${d.nam_tuoi}`], ["Xung năm", `Tuổi ${d.xung}`], ["Hợp năm", `Tuổi ${d.tuoi_hop.join(", ")}`],
    ["Rằm tháng Giêng", dmy(d.moc.find((m) => m.ma === "ram_gieng")?.duong ?? d.tet)],
    ["Tam tai", `Tuổi ${d.tam_tai.tuoi.join(", ")} (năm thứ ${d.tam_tai.nam_thu})`],
    ["Năm thế giới (thần số)", d.so_nam_the_gioi.so === d.so_nam_the_gioi.rut_gon ? String(d.so_nam_the_gioi.so) : `${d.so_nam_the_gioi.so} / ${d.so_nam_the_gioi.rut_gon}`],
  ];   // 12 ô: kín hàng ở lưới 2 và 3 cột
  const tra: { href: string; ten: string; mo_ta: string }[] = [
    { href: duongSaoHanNam(n), ten: `Sao hạn năm ${n}`, mo_ta: "Sao Cửu Diệu theo tuổi, nam và nữ" },
    { href: duongLamNhaNam(n), ten: `Tuổi làm nhà năm ${n}`, mo_ta: "Kim lâu, Hoang ốc, Tam tai từng tuổi" },
    { href: duongCuoiHoi(n), ten: `Cưới năm ${n} tuổi nào`, mo_ta: "Kim lâu theo tuổi mụ cô dâu" },
    { href: duongSinhCon(n), ten: `Sinh con năm ${n}`, mo_ta: "Tuổi bố mẹ hợp, xung với tuổi con" },
    { href: duongXongDatNam(n), ten: `Tuổi xông đất Tết ${n}`, mo_ta: "Tuổi hợp theo từng tuổi gia chủ" },
    { href: duongHanNam(n), ten: `Hướng xấu năm ${n}`, mo_ta: "Thái Tuế, Tam Sát, Ngũ Hoàng" },
    { href: duongLichAm(n), ten: `Lịch âm ${n}`, mo_ta: "Mùng 1, rằm từng tháng, tháng đủ thiếu" },
    { href: duongThang(tetY, tetM), ten: `Ngày tốt tháng ${tetM}/${tetY}`, mo_ta: "Tháng có Tết: ngày hoàng đạo, giờ tốt" },
    ...(n <= MENH_TOI ? [{ href: duongTrang("menh_nam", `sinh-nam-${n}-menh-gi`), ten: `Sinh năm ${n} mệnh gì`, mo_ta: "Mệnh, màu hợp, tuổi hợp, cung phi" }] : []),
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Năm ${d.can_chi}`, "Âm lịch Việt Nam", "Tết Nguyên đán"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/nam" className="hover:underline">Xem theo năm</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      <section className="mt-6" aria-labelledby="thong-tin">
        <h2 id="thong-tin" className="sr-only">Thông tin năm {n}</h2>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="o-nam">
          {o.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line/70 p-3">
              <dt className="text-xs text-fg-faint">{k}</dt><dd className="mt-0.5 text-sm text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-fg-faint">Sinh tháng 1 hoặc đầu tháng 2/{n} trước Tết thì thuộc năm {d.nam_truoc_tet.can_chi} ({d.nam_truoc_tet.nam}).</p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface/40 p-5" aria-labelledby="ca-nhan">
        <h2 id="ca-nhan" className="text-xl">{c("ca_nhan.tieu_de", bien)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c("ca_nhan.mo_ta", bien)}</p>
        <Link href={`/thoi-gian-toi?nam=${n}`} className="mt-3 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg" data-testid="nut-ca-nhan">{c("ca_nhan.nut", bien)}</Link>
      </section>

      <section className="mt-8" aria-labelledby="tra">
        <h2 id="tra" className="text-2xl">{c("tra.tieu_de", bien)}</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {tra.map((x) => (
            <li key={x.href}><Link href={x.href} className="block rounded-xl border border-line/70 p-3 hover:border-gold/50">
              <span className="text-fg">{x.ten}</span><span className="mt-0.5 block text-xs text-fg-muted">{x.mo_ta}</span>
            </Link></li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="con-giap">
        <h2 id="con-giap" className="text-2xl">{c("con_giap.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("con_giap.mo_ta", bien)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm" data-testid="bang-con-giap">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Tuổi</th><th className="pr-3">Với năm {d.con_giap}</th><th className="pr-3">Tam tai</th><th>Năm sinh</th></tr></thead>
            <tbody>
              {d.bang_con_giap.map((r) => (
                <tr key={r.chi} className="border-t border-line/50 align-top">
                  <td className="py-2 pr-3 font-medium text-fg">{r.chi}</td>
                  <td className="py-2 pr-3"><span className="text-fg">{r.nhan}</span><span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{r.loi}</span></td>
                  <td className="py-2 pr-3 text-fg-muted">{r.tam_tai ? `Năm thứ ${r.tam_tai}` : "—"}</td>
                  <td className="py-2 text-xs text-fg-muted tabular-nums">{r.nam_sinh.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="moc">
        <h2 id="moc" className="text-2xl">{c("moc.tieu_de", bien)}</h2>
        <ul className="mt-3 divide-y divide-line/50 rounded-xl border border-line/70">
          {d.moc.map((m) => (
            <li key={m.ma} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-fg">{m.ten}</span><span className="tabular-nums text-fg-muted">{dmy(m.duong)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="han-nam">
        <h2 id="han-nam" className="text-2xl">Hướng nên tránh động thổ năm {n}</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {d.han_nam.huong_tranh.map((h) => <li key={h.ma}><b className="text-fg">{h.ten}</b> <span className="text-fg-muted">ở phương {h.phuong}</span></li>)}
        </ul>
        <p className="mt-2 text-sm text-fg-muted">{d.han_nam.moc} <Link href={duongHanNam(n)} className="text-gold underline">Đọc kỹ hướng xấu năm {n}</Link>.</p>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted" data-nosnippet="">{d.luu_y}</p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > 2006 && <Link href={duongNam(n - 1)} className="text-gold underline">Năm {n - 1}</Link>}
        {n < 2099 && <Link href={duongNam(n + 1)} className="text-gold underline">Năm {n + 1}</Link>}
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
