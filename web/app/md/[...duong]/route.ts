// Bản Markdown cho bot AI: /<đường dẫn>.md được rewrite sang /md/<đường dẫn> (next.config.mjs).
// /index.md · /huyen-hoc.md · /kien-thuc.md · /<mảng>/<cụm>.md · /<mảng>/<cụm>/<trang>.md · /phong-thuy/huong-hop-tuoi[/<tuổi>].md · /tu-dien.md
import { CHU_DE, cungPhi, dsCumTru, dsCungPhi, duongTuoi, khoaTheoDuong, mucLuc, trang, tuDien } from "@/lib/kien-thuc";
import { mdChuDe, mdDsTuoi, mdHuyenHoc, mdThuVien, mdTrang, mdTuDien, mdCung, TEN_MANG, traMd } from "@/lib/markdown";
import { MANG_HH, TRA_CUU_THEM, lichHH, namNayVn } from "@/lib/huyen-hoc";
import { CHU_HUYEN_HOC, SO_HOI_DAP_HUYEN_HOC } from "@/lib/chu/trang-tinh";
import { mucSoTrang } from "@/lib/so-trang";
import { boNhan, taoChu } from "@/lib/chu-trang";
import { taoLlmsTxt } from "@/lib/llms";
import { urlDayDu } from "@/lib/seo";
import { baiCms, tinhNangCms } from "@/lib/cms";
import { htmlSangMd, locHtmlCms } from "@/lib/cms-html";
import { layDauNhieuTrang, layNoiDungTrang, mdKhoi } from "@/lib/noi-dung-trang";
import { DUONG_SINH_NN, dmy, duongSinhNN, mucLucSinhNN, nuocSinhNN } from "@/lib/sinh-nuoc-ngoai";

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
    if (p.length === 2) { const d = await dsCungPhi(); return traMd(mdDsTuoi(d.cung, d.tuoi), duongTuoi("huong-hop-tuoi")); }
    const c = await cungPhi(p[2]!);   // AUD-Q2: trang cung phi (trang năm .md đã 308 về mục lục .md)
    return c ? traMd(await voiKhoi(mdCung(c), duongTuoi(c.slug), { tieu_de: c.tieu_de }), duongTuoi(c.slug)) : KHONG_CO();
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
    const cumGoc = Object.fromEntries(MANG_HH.map((m) => [m.khoa, [...dsCumTru(m.href), ...(TRA_CUU_THEM[m.khoa] ?? [])].slice(0, 4)]));
    const dau = await layDauNhieuTrang(Object.values(cumGoc).flat().map((x) => x.duong));   // tên cụm = H1 CMS như trang HTML
    const cum = Object.fromEntries(MANG_HH.map((m) => [m.khoa, cumGoc[m.khoa]!.map((x) => ({ duong: x.duong, ten: dau[x.duong]?.ten ?? x.ten,
      n: x.khoa ? ds.filter((t) => t.loai === CHU_DE[x.khoa!]!.loai).length : 0,
      md: Boolean(x.khoa) || x.duong === duongTuoi("huong-hop-tuoi") }))]));   // chỉ cụm có route .md ở trên
    const noi = mdHuyenHoc({ c: taoChu(CHU_HUYEN_HOC, nd.chu), h1: boNhan(nd.dau.h1 ?? md.h1!), loiDan: boNhan(nd.dau.loiDan ?? md.loi_dan!),
      nam, lich: lichHH(nam), soDap: SO_HOI_DAP_HUYEN_HOC, cum });
    return traMd(await voiKhoi(noi, "/huyen-hoc", {}), "/huyen-hoc");
  }
  // Ý3: /sinh-o-nuoc-ngoai(.md) + /sinh-o-nuoc-ngoai/{nước}(.md) — cùng dữ kiện engine với trang HTML.
  if (p[0] === "sinh-o-nuoc-ngoai" && p.length <= 2) {
    if (p.length === 1) {
      const ds = await mucLucSinhNN();
      const md = mucSoTrang(DUONG_SINH_NN)!.mac_dinh;
      const noi = [`# ${md.h1}`, "", md.loi_dan ?? "", "", "## Chọn nước nơi bạn sinh", "",
        ...ds.map((n) => `- [${n.ten}](${urlDayDu(duongSinhNN(n.ma))}): ${n.mui_gio.join(" · ")} · ${n.gio_mua_he ? "có giờ mùa hè" : "không giờ mùa hè"}${n.nam_ban_cau ? " · Nam bán cầu" : ""}`), ""].join("\n");
      return traMd(await voiKhoi(noi, DUONG_SINH_NN, {}), DUONG_SINH_NN);
    }
    const d = /^[a-z]{2}$/.test(p[1]!) ? await nuocSinhNN(p[1]!) : null;
    if (!d) return KHONG_CO();
    const duong = duongSinhNN(d.ma);
    const noi = [`# ${d.tieu_de}`, "", "## Trả lời nhanh", "", d.tra_loi_nhanh, "", ...(d.ghi_chu_nuoc ? [d.ghi_chu_nuoc, ""] : []),
      `## Múi giờ và giờ mùa hè từng thành phố năm ${d.nam}`, "", "| Thành phố | Giờ chuẩn | Giờ mùa hè | Lệch giờ mặt trời |", "|---|---|---|---|",
      ...d.thanh_pho.map((t) => `| ${t.ten} | ${t.nhan_utc} | ${t.gio_mua_he ? t.doi_gio.map((m) => `${dmy(m.ngay)} ${m.gio} → ${m.sang}`).join("; ") : "không"} | ${t.lech_mat_troi_phut === null ? "—" : `${t.lech_mat_troi_phut > 0 ? "+" : ""}${t.lech_mat_troi_phut} phút`} |`), "",
      "## Năm bạn sinh có giờ mùa hè không?", "", `| Vùng giờ | ${d.nam_mau.join(" | ")} |`, `|---|${d.nam_mau.map(() => "---").join("|")}|`,
      ...d.lich_su_gio_mua_he.map((z) => `| ${z.zone} | ${z.cac_nam.map((o) => (o.co ? `Có (${o.moc.join("; ")})` : "Không")).join(" | ")} |`), "",
      "## Lịch âm Việt – Trung", "", `${d.cau.lich_am} ${d.cau.tet}`, "",
      ...(d.cong_tac.gio_mat_troi || d.cong_tac.mua_noi_sinh ? ["## Hai cách xem thêm", "", ...(d.cong_tac.gio_mat_troi ? [`- Giờ mặt trời thực: ${d.cau.mat_troi}`] : []), ...(d.cong_tac.mua_noi_sinh ? [`- Mùa nơi sinh (Bát tự): ${d.cau.mua}`] : []), ""] : []),
      "## Nhập hồ sơ", "", ...d.huong_dan.map((h) => `- ${h}`), "", d.cau.ket, "",
      "## Câu hỏi thường gặp", "", ...d.hoi_dap.flatMap((h) => [`### ${h.hoi}`, "", h.dap, ""])].join("\n");
    return traMd(await voiKhoi(noi, duong, { nuoc: d.ma, ten: d.ten, nam: String(d.nam) }), duong);
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
