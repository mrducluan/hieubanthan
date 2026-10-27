// Bản Markdown cho bot AI: /<đường dẫn>.md được rewrite sang /md/<đường dẫn> (next.config.mjs).
// /index.md · /huyen-hoc.md · /kien-thuc.md · /<mảng>/<cụm>.md · /<mảng>/<cụm>/<trang>.md · /phong-thuy/huong-hop-tuoi[/<tuổi>].md · /tu-dien.md
import { CHU_DE, dsCumTru, dsTuoiHuong, duongTuoi, khoaTheoDuong, mucLuc, trang, tuDien, tuoiHuong } from "@/lib/kien-thuc";
import { mdChuDe, mdDsTuoi, mdHuyenHoc, mdThuVien, mdTrang, mdTuDien, mdTuoi, TEN_MANG, traMd } from "@/lib/markdown";
import { MANG_HH, TRA_CUU_THEM, lichHH, namNayVn } from "@/lib/huyen-hoc";
import { CHU_HUYEN_HOC, SO_HOI_DAP_HUYEN_HOC } from "@/lib/chu/trang-tinh";
import { mucSoTrang } from "@/lib/so-trang";
import { boNhan, taoChu } from "@/lib/chu-trang";
import { taoLlmsTxt } from "@/lib/llms";
import { baiCms, tinhNangCms } from "@/lib/cms";
import { htmlSangMd, locHtmlCms } from "@/lib/cms-html";
import { layNoiDungTrang, mdKhoi } from "@/lib/noi-dung-trang";

/** ND-5: chữ khối CMS (mẫu cụm + ghi đè) nối vào cuối bản Markdown — cùng nội dung với trang HTML. */
async function voiKhoi(md: string, duong: string, bien: Record<string, string>) {
  const nd = await layNoiDungTrang(duong, bien);
  const them = mdKhoi([...nd.khoi.tren, ...nd.khoi.duoi, ...nd.khoi.cuoi]);
  return them ? `${md.trimEnd()}\n\n${them}\n` : md;
}

export const revalidate = 21600;

const KHONG_CO = () => new Response("Không có bản Markdown cho trang này.\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

export async function GET(_req: Request, { params: thamSo }: { params: Promise<{ duong: string[] }> }) {
  const params = await thamSo;
  const p = params.duong.map(decodeURIComponent);
  if (p.length === 1 && p[0] === "index") return traMd(await taoLlmsTxt(), "/");
  if (p.length === 1 && p[0] === "tu-dien") {
    const d = await tuDien();
    return d ? traMd(mdTuDien(d.muc, TEN_MANG), "/tu-dien") : KHONG_CO();
  }
  if (p[0] === "phong-thuy" && p[1] === "huong-hop-tuoi" && p.length <= 3) {
    if (p.length === 2) return traMd(mdDsTuoi(await dsTuoiHuong()), duongTuoi("huong-hop-tuoi"));
    const t = await tuoiHuong(p[2]!);
    return t ? traMd(await voiKhoi(mdTuoi(t), duongTuoi(t.slug), { tieu_de: t.tieu_de }), duongTuoi(t.slug)) : KHONG_CO();
  }
  if (p[0] === "blog" && p.length === 2) {
    // Bài CMS: bản Markdown cùng nội dung trang HTML (tắt được ở CMS → Tính năng nội dung).
    const [tn, c] = await Promise.all([tinhNangCms(), baiCms(p[1]!)]);
    if (!tn.ban_markdown || !c || !("bai" in c) || c.bai.noindex) return KHONG_CO();
    const b = c.bai;
    const md = [`# ${b.tieu_de}`, "", b.mo_ta_ngan ?? "", "",
      ...(b.tra_loi_nhanh ? ["## Trả lời nhanh", "", b.tra_loi_nhanh, ""] : []),
      htmlSangMd(locHtmlCms(b.noi_dung_html).html), "",
      ...((b.hoi_dap ?? []).length ? ["## Câu hỏi thường gặp", "", ...(b.hoi_dap ?? []).flatMap((h) => [`### ${h.cau_hoi}`, "", h.tra_loi, ""])] : []),
      ...((b.nguon ?? []).length ? ["## Nguồn tham khảo", "", ...(b.nguon ?? []).map((n) => `- ${n.url ? `[${n.ten}](${n.url})` : n.ten}`), ""] : []),
    ].join("\n").replace(/\n{3,}/g, "\n\n");
    return traMd(md, `/blog/${b.slug}`);
  }
  if (p.length === 1 && p[0] === "kien-thuc") return traMd(mdThuVien(await mucLuc()), "/kien-thuc");
  if (p.length === 1 && p[0] === "huyen-hoc") {
    // HH-1: hub Huyền học — chữ CMS (bảng chữ, H1, lời dẫn) như trang HTML; số trang mỗi cụm tra cứu từ mục lục engine.
    const [nd, ds] = await Promise.all([layNoiDungTrang("/huyen-hoc"), mucLuc()]);
    const md = mucSoTrang("/huyen-hoc")!.mac_dinh, nam = namNayVn();
    const cum = Object.fromEntries(MANG_HH.map((m) => [m.khoa, [...dsCumTru(m.href), ...(TRA_CUU_THEM[m.khoa] ?? [])].slice(0, 4).map((x) => ({ duong: x.duong, ten: x.ten,
      n: x.khoa ? ds.filter((t) => t.loai === CHU_DE[x.khoa!]!.loai).length : 0,
      md: Boolean(x.khoa) || x.duong === duongTuoi("huong-hop-tuoi") }))]));   // chỉ cụm có route .md ở trên
    const noi = mdHuyenHoc({ c: taoChu(CHU_HUYEN_HOC, nd.chu), h1: boNhan(nd.dau.h1 ?? md.h1!), loiDan: boNhan(nd.dau.loiDan ?? md.loi_dan!),
      nam, lich: lichHH(nam), soDap: SO_HOI_DAP_HUYEN_HOC, cum });
    return traMd(await voiKhoi(noi, "/huyen-hoc", {}), "/huyen-hoc");
  }
  // QH-URL: cụm /{mảng}/{cụm}(.md) và trang /{mảng}/{cụm}/{trang}(.md)
  if (p.length < 2 || p.length > 3) return KHONG_CO();
  const khoa = khoaTheoDuong(`/${p[0]}/${p[1]}`), slug = p[2];
  const cd = khoa ? CHU_DE[khoa] : undefined;
  if (!khoa || !cd) return KHONG_CO();
  if (!slug) {
    const md = mdChuDe(khoa, await mucLuc());
    return md ? traMd(md, cd.duong) : KHONG_CO();
  }
  const t = await trang(cd.loai, slug);
  const duong = `${cd.duong}/${slug}`;
  return t ? traMd(await voiKhoi(mdTrang(t), duong, { tieu_de: t.tieu_de, mo_ta: t.mo_ta, ten_chu_de: cd.ten }), duong) : KHONG_CO();
}
