"use client";
// BLOG-3 — đầu danh sách "Bài viết": bảng bài trao đổi NotFair đang hiện ở hieuban.com/blog. Bấm "Nhập vào CMS để sửa"
// → bài thành NHÁP cùng đường dẫn (chữ, ảnh bìa, ảnh trong bài vào Thư viện ảnh). Sửa xong bấm Xuất bản: web hiện bản CMS
// thay bản NotFair ở đúng URL đó. Chưa xuất bản thì web vẫn hiện bản NotFair.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Dong = { slug: string; url: string; tieu_de: string; ngay: string | null; anh: string; id_cms: number | string | null; trang_thai_cms: string | null };
type Ds = { co_khoa?: boolean; nguon?: "truc_tiep" | "qua_web" | null; ds?: Dong[]; loi?: string };

const suaUrl = (id: number | string) => `/admin/collections/bai-viet/${id}`;

export function NhapNotFair() {
  const [ds, setDs] = useState<Ds | null>(null);
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState<string | null>(null);
  const [tb, setTb] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mo || ds) return;
    void fetch("/api/bai-viet/notfair", { credentials: "include" })
      .then(async (r) => (r.status === 403 ? { ds: [], loi: "Chỉ ban biên tập xem được." } : ((await r.json()) as Ds)))
      .catch(() => ({ ds: [], loi: "Không kết nối được CMS." }))
      .then(setDs);
  }, [mo, ds]);

  type KqNhap = { ok?: boolean; id?: number | string; da_co?: boolean; anh_loi?: string[]; loi_kho?: string; loi?: string };
  const KHO_LOI = "Kho ảnh đang lỗi nên ảnh để chỗ đánh dấu \"[Ảnh chưa nhập …]\" trong bài — sửa kho (Thư viện ảnh → Kiểm tra kho ảnh) rồi tải ảnh vào; bài chưa xuất bản được khi còn chỗ đánh dấu.";
  async function goiNhap(slug: string): Promise<KqNhap> {
    const r = await fetch("/api/bai-viet/nhap-notfair", {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }),
    }).catch(() => null);
    return ((await r?.json().catch(() => null)) ?? { loi: "Không kết nối được CMS." }) as KqNhap;
  }

  async function nhap(slug: string) {
    setDang(slug);
    setTb(null);
    const d = await goiNhap(slug);
    setDang(null);
    if (!d.ok || d.id == null) { setTb(`Chưa nhập được: ${d.loi ?? "lỗi không rõ"}`); return; }
    if (d.anh_loi?.length) {
      // Vẫn mở bài; báo ảnh nào chưa tải được để Chủ biên tự tải lên lại.
      window.alert(`Đã nhập bài (chữ đầy đủ). ${d.anh_loi.length} ảnh chưa tải được — tải lên lại trong bài:\n${d.anh_loi.join("\n")}`
        + (d.loi_kho ? `\n\n${KHO_LOI}\nLỗi kho: ${d.loi_kho}` : ""));
    }
    router.push(suaUrl(d.id));
  }

  /** Nhập lần lượt mọi bài chưa có trong CMS (tuần tự để không tải ảnh dồn dập), rồi đọc lại bảng. */
  async function nhapTatCa() {
    const chua = (ds?.ds ?? []).filter((d) => d.id_cms == null);
    if (!chua.length) return;
    if (!window.confirm(`Nhập ${chua.length} bài NotFair thành nháp trong CMS? Web vẫn hiện bản NotFair cho tới khi anh/chị xuất bản từng bài.`)) return;
    setTb(null);
    let xong = 0; const loi: string[] = []; let anhLoi = 0; let loiKho = "";
    for (const d of chua) {
      setDang(d.slug);
      const kq = await goiNhap(d.slug);
      if (kq.ok && kq.id != null) { xong++; anhLoi += kq.anh_loi?.length ?? 0; loiKho ||= kq.loi_kho ?? ""; } else loi.push(`${d.tieu_de}: ${kq.loi ?? "lỗi không rõ"}`);
    }
    setDang(null);
    setTb(`Đã nhập ${xong}/${chua.length} bài thành nháp.${anhLoi ? ` ${anhLoi} ảnh chưa tải được (mở từng bài để tải lại).` : ""}${loiKho ? ` ${KHO_LOI}` : ""}${loi.length ? ` Chưa nhập được: ${loi.join(" · ")}` : ""}`);
    setDs(null);   // đọc lại bảng → cột trạng thái + nút "Mở bài"
  }

  /** BLOG-7: chuẩn hoá SEO mọi bài NotFair đã nhập → bản nháp "Gửi duyệt" (bản đang hiện trên web chưa đổi). */
  async function chuanHoa() {
    if (!window.confirm("Chuẩn hoá SEO mọi bài NotFair đã nhập? Hệ thống điền trường còn thiếu, đổi đường dẫn sang không dấu "
      + "(đường dẫn cũ tự chuyển 308), vẽ ảnh nền sáng, thêm hỏi đáp + liên kết nội bộ. Kết quả là BẢN NHÁP — đọc lại rồi bấm Xuất bản từng bài.")) return;
    setDang("__chuan_hoa");
    setTb(null);
    type KqBai = { tieu_de: string; thay_doi: string[]; diem_truoc: number; diem_sau: number; loi?: string };
    const kq: KqBai[] = [];
    const can = (ds?.ds ?? []).filter((x) => x.id_cms != null);
    for (const [i, x] of can.entries()) {
      setTb(`Đang chuẩn hoá ${i + 1}/${can.length}: ${x.tieu_de}`);
      const r = await fetch("/api/bai-viet/chuan-hoa-notfair", { method: "POST", credentials: "include",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ id: x.id_cms }) }).catch(() => null);
      const d = ((await r?.json().catch(() => null)) ?? { loi: "Không kết nối được CMS." }) as { ok?: boolean; loi?: string; ds?: KqBai[] };
      if (d.ok && d.ds) kq.push(...d.ds); else kq.push({ tieu_de: x.tieu_de, thay_doi: [], diem_truoc: 0, diem_sau: 0, loi: `${x.tieu_de}: ${d.loi ?? "lỗi"}` });
    }
    setDang(null);
    const doi = kq.filter((b) => b.thay_doi.length);
    const loi = kq.filter((b) => b.loi);
    setTb(`Đã xem ${kq.length} bài: ${doi.length} bài có bản nháp chuẩn hoá (trạng thái "Gửi duyệt", điểm kiểm định `
      + `${doi.map((b) => `${b.diem_truoc}→${b.diem_sau}`).join(", ") || "—"}); ${kq.length - doi.length - loi.length} bài đã chuẩn từ trước.`
      + `${loi.length ? ` Lỗi: ${loi.map((b) => b.loi).join(" · ")}` : ""} Mở từng bài, đọc "Ghi chú của Chủ biên" rồi bấm Xuất bản.`);
    setDs(null);
    router.refresh();
  }

  const nhan = (d: Dong) => d.id_cms == null ? "Đang dùng bản NotFair"
    : d.trang_thai_cms === "published" ? "Đã sửa trong CMS (đang hiện bản CMS)" : "Đã nhập, đang sửa nháp (web vẫn hiện bản NotFair)";

  return (
    <div style={{ margin: "0 0 16px", border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: "10px 14px" }}
      data-testid="nhap-notfair">
      <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setMo(!mo)} aria-expanded={mo}>
        {mo ? "Ẩn bài NotFair" : "Bài trao đổi NotFair — nhập vào CMS để sửa"}
      </button>
      {mo && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Bài NotFair tự đăng ở /blog. Muốn sửa chữ, ảnh: bấm <b>Nhập vào CMS</b> → bài thành nháp cùng đường dẫn → sửa → <b>Xuất bản</b>.
            Giữ nguyên các link của đối tác và dòng ghi nguồn cuối bài (NotFair kiểm tra các link này).
          </p>
          {!ds ? <p>Đang tải…</p>
            : ds.co_khoa === false ? <p role="alert">CMS chưa đọc được NotFair: cần <code>NOTFAIR_SEO_API_KEY</code> (khoá riêng của CMS) <i>hoặc</i> cặp <code>CMS_WEBHOOK_SECRET</code> + <code>WEB_URL</code> (CMS sẽ đọc bài qua hieuban.com) trong biến môi trường của dự án CMS trên Vercel.</p>
            : ds.loi ? <p role="alert">Chưa đọc được danh sách: {ds.loi}</p>
            : !ds.ds?.length ? <p>Chưa có bài NotFair nào.</p>
            : (
              <>
              {ds.nguon === "qua_web" && <p style={{ margin: "0 0 8px", opacity: 0.65 }}>Đang đọc bài NotFair qua hieuban.com (dự án CMS chưa đặt khoá riêng — không cần đặt).</p>}
              {ds.ds.some((d) => d.id_cms != null) && (
                <p style={{ margin: "0 0 10px" }}>
                  <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={dang !== null}
                    onClick={() => void chuanHoa()} data-testid="chuan-hoa-notfair">
                    {dang === "__chuan_hoa" ? "Đang chuẩn hoá… (vẽ ảnh, có thể mất 1–2 phút)" : "Chuẩn hoá SEO các bài đã nhập"}
                  </button>
                </p>
              )}
              {ds.ds.some((d) => d.id_cms == null) && (
                <p style={{ margin: "0 0 10px" }}>
                  <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }} disabled={dang !== null}
                    onClick={() => void nhapTatCa()} data-testid="nhap-tat-ca">
                    {dang ? "Đang nhập…" : `Nhập tất cả ${ds.ds.filter((d) => d.id_cms == null).length} bài chưa có`}
                  </button>
                </p>
              )}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ textAlign: "left" }}><th>Bài</th><th>Trạng thái</th><th /></tr></thead>
                <tbody>
                  {ds.ds.map((d) => (
                    <tr key={d.slug} style={{ borderTop: "1px solid var(--theme-elevation-100)" }}>
                      <td style={{ padding: "6px 8px 6px 0" }}>
                        <a href={d.url} target="_blank" rel="noopener noreferrer">{d.tieu_de}</a>
                        {d.ngay && <span style={{ opacity: 0.6 }}> · {d.ngay.slice(0, 10).split("-").reverse().join("/")}</span>}
                      </td>
                      <td style={{ padding: "6px 8px", opacity: 0.8 }}>{nhan(d)}</td>
                      <td style={{ padding: "6px 0", textAlign: "right", whiteSpace: "nowrap" }}>
                        {d.id_cms != null
                          ? <a className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} href={suaUrl(d.id_cms)}>Mở bài</a>
                          : <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }}
                              disabled={dang !== null} onClick={() => void nhap(d.slug)}>
                              {dang === d.slug ? "Đang nhập…" : "Nhập vào CMS"}
                            </button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          {tb && <p role="alert" style={{ marginTop: 8 }}>{tb}</p>}
        </div>
      )}
    </div>
  );
}
