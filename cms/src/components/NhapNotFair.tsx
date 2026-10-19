"use client";
// BLOG-3 — đầu danh sách "Bài viết": bảng bài trao đổi NotFair đang hiện ở hieuban.com/blog. Bấm "Nhập vào CMS để sửa"
// → bài thành NHÁP cùng đường dẫn (chữ, ảnh bìa, ảnh trong bài vào Thư viện ảnh). Sửa xong bấm Xuất bản: web hiện bản CMS
// thay bản NotFair ở đúng URL đó. Chưa xuất bản thì web vẫn hiện bản NotFair.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Dong = { slug: string; url: string; tieu_de: string; ngay: string | null; anh: string; id_cms: number | string | null; trang_thai_cms: string | null };
type Ds = { co_khoa?: boolean; ds?: Dong[]; loi?: string };

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

  async function nhap(slug: string) {
    setDang(slug);
    setTb(null);
    const r = await fetch("/api/bai-viet/nhap-notfair", {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }),
    }).catch(() => null);
    const d = ((await r?.json().catch(() => null)) ?? { loi: "Không kết nối được CMS." }) as
      { ok?: boolean; id?: number | string; da_co?: boolean; anh_loi?: string[]; loi?: string };
    setDang(null);
    if (!d.ok || d.id == null) { setTb(`Chưa nhập được: ${d.loi ?? "lỗi không rõ"}`); return; }
    if (d.anh_loi?.length) {
      // Vẫn mở bài; báo ảnh nào chưa tải được để Chủ biên tự tải lên lại.
      window.alert(`Đã nhập bài. ${d.anh_loi.length} ảnh chưa tải được — tải lên lại trong bài:\n${d.anh_loi.join("\n")}`);
    }
    router.push(suaUrl(d.id));
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
            : ds.co_khoa === false ? <p role="alert">CMS chưa có khoá NOTFAIR_SEO_API_KEY (đặt trong biến môi trường của dự án CMS trên Vercel).</p>
            : ds.loi ? <p role="alert">Chưa đọc được danh sách: {ds.loi}</p>
            : !ds.ds?.length ? <p>Chưa có bài NotFair nào.</p>
            : (
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
            )}
          {tb && <p role="alert" style={{ marginTop: 8 }}>{tb}</p>}
        </div>
      )}
    </div>
  );
}
